BEGIN
  /*
  ============================================================================
  SP: sp_refresh_fundamentals_tables
  Propósito: Normalizar datos SEC → fundamentals_timeseries + fundamentals_ratios
  Autor: Aaron / Indicium Signals
  Fecha: 02 diciembre 2025
  ============================================================================
  
  Proceso:
  1. Extrae datos de Num/Sub/Tag con mapeo CIK→Ticker
  2. Pivotea tags SEC a columnas normalizadas
  3. Calcula Q4 implícito donde falta
  4. Inserta a fundamentals_timeseries
  5. Calcula ratios → fundamentals_ratios
  
  Idempotencia: TRUNCATE + INSERT (reemplaza todo)
  Duración: ~5-10 min para 43 quarters
  ============================================================================
  */
  
  DECLARE last_refresh_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP();
  
  -- Log inicio
  SELECT CONCAT('✅ Iniciando refresh fundamentals: ', CAST(last_refresh_time AS STRING)) as log_message;
  
  -- =========================================================================
  -- CTE 1: BASE DATA - Combinar Sub + Num + Mapping
  -- =========================================================================
  
  CREATE TEMP TABLE base_data AS
  SELECT 
    -- Identity
    m.ticker,
    s.cik,
    m.company_name,
    
    -- Period info
    s.fy as fiscal_year,
    s.fp as fiscal_period,
    PARSE_DATE('%Y%m%d', CAST(s.period AS STRING)) as period_end_date,
    s.fye as fiscal_year_end_mmdd,
    
    -- Determine period type
    CASE 
      WHEN s.fp IN ('Q1', 'Q2', 'Q3') THEN 'quarterly'
      WHEN s.fp = 'FY' THEN 'annual'
      ELSE 'other'
    END as period_type,
    
    -- Filing metadata
    s.form as form_type,
    s.filed_date as filing_date,
    s.adsh,
    
    -- Numeric values (pivot happens later)
    n.tag,
    n.version,
    n.qtrs,
    n.value,
    n.ddate,
    s.period as period_yyyymmdd  -- Agregar period para comparar con ddate
    
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.Sub` s
  INNER JOIN `sunny-advantage-471523-b3.IS_Fundamentales.cik_ticker_mapping` m ON s.cik = m.cik
  INNER JOIN `sunny-advantage-471523-b3.IS_Fundamentales.Num` n ON s.adsh = n.adsh
  WHERE 
    s.form IN ('10-Q', '10-K')  -- Solo quarterly y annual reports
    AND m.is_active = TRUE  -- Solo tickers activos
    AND n.value IS NOT NULL  -- Ignorar nulls
    AND s.fy >= 2015  -- Desde 2015 en adelante
  ;
  
  SELECT COUNT(*) as base_data_rows FROM base_data;
  
  -- =========================================================================
  -- CTE 2: PIVOT INCOME STATEMENT TAGS
  -- =========================================================================
  
  CREATE TEMP TABLE income_statement_pivot AS
  SELECT
    ticker,
    cik,
    company_name,
    fiscal_year,
    fiscal_period,
    period_end_date,
    fiscal_year_end_mmdd,
    period_type,
    form_type,
    MAX(filing_date) as filing_date,  -- CORRECCIÓN #2: Agregar MAX para filing_date
    MAX(adsh) as adsh,  -- CORRECCIÓN #2: Agregar MAX para adsh (solo para referencia)
    
    -- Income Statement fields (buscar tags más comunes)
    MAX(CASE WHEN tag IN ('Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet') THEN value END) as revenues,
    MAX(CASE WHEN tag IN ('CostOfRevenue', 'CostOfGoodsAndServicesSold') THEN value END) as cost_of_revenue,
    MAX(CASE WHEN tag = 'GrossProfit' THEN value END) as gross_profit,
    MAX(CASE WHEN tag IN ('OperatingExpenses', 'OperatingCostsAndExpenses') THEN value END) as operating_expenses,
    MAX(CASE WHEN tag IN ('ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost') THEN value END) as research_development,
    MAX(CASE WHEN tag IN ('SellingGeneralAndAdministrativeExpense', 'GeneralAndAdministrativeExpense') THEN value END) as selling_general_admin,
    MAX(CASE WHEN tag IN ('OperatingIncomeLoss', 'OperatingIncome') THEN value END) as operating_income,
    MAX(CASE WHEN tag IN ('InterestExpense', 'InterestExpenseDebt') THEN value END) as interest_expense,
    MAX(CASE WHEN tag IN ('InterestIncomeExpenseNet', 'InterestAndDividendIncomeOperating') THEN value END) as interest_income,
    MAX(CASE WHEN tag IN ('OtherNonoperatingIncomeExpense', 'NonoperatingIncomeExpense') THEN value END) as other_income_expense,
    MAX(CASE WHEN tag = 'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest' THEN value END) as income_before_tax,
    MAX(CASE WHEN tag IN ('IncomeTaxExpenseBenefit', 'IncomeTaxesPaid') THEN value END) as income_tax_expense,
    MAX(CASE WHEN tag IN ('NetIncomeLoss', 'ProfitLoss') THEN value END) as net_income,
    
    -- EPS
    MAX(CASE WHEN tag = 'EarningsPerShareBasic' THEN value END) as eps_basic,
    MAX(CASE WHEN tag = 'EarningsPerShareDiluted' THEN value END) as eps_diluted,
    MAX(CASE WHEN tag = 'WeightedAverageNumberOfSharesOutstandingBasic' THEN value END) as shares_outstanding_basic,
    MAX(CASE WHEN tag = 'WeightedAverageNumberOfDilutedSharesOutstanding' THEN value END) as shares_outstanding_diluted
    
  FROM base_data
  WHERE qtrs IN (1, 4)  -- CORRECCIÓN #1: Solo quarterly (1) y annual (4) para IS, NO qtrs=0 (BS)
  GROUP BY ticker, cik, company_name, fiscal_year, fiscal_period, period_end_date, 
           fiscal_year_end_mmdd, period_type, form_type  -- CORRECCIÓN #2: Eliminado adsh y filing_date
  ;
  
  SELECT COUNT(*) as income_statement_pivot_rows FROM income_statement_pivot;
  
  -- =========================================================================
  -- CTE 3: PIVOT BALANCE SHEET TAGS
  -- =========================================================================
  
  CREATE TEMP TABLE balance_sheet_pivot AS
  SELECT
    ticker,
    cik,
    fiscal_year,
    fiscal_period,
    period_end_date,
    MAX(adsh) as adsh,  -- CORRECCIÓN: Seleccionar el adsh más reciente
    MAX(filing_date) as filing_date,  -- CORRECCIÓN: Agregar filing_date para referencia
    
    -- Balance Sheet fields - CORRECCIÓN CRÍTICA: Filtro ddate = period_yyyymmdd para evitar valores de FY pegados a quarters
    MAX(CASE WHEN tag = 'Assets' AND ddate = period_yyyymmdd THEN value END) as assets,
    MAX(CASE WHEN tag = 'AssetsCurrent' AND ddate = period_yyyymmdd THEN value END) as current_assets,
    MAX(CASE WHEN tag IN ('CashAndCashEquivalentsAtCarryingValue', 'Cash') AND ddate = period_yyyymmdd THEN value END) as cash_and_equivalents,
    MAX(CASE WHEN tag IN ('ShortTermInvestments', 'AvailableForSaleSecuritiesCurrent') AND ddate = period_yyyymmdd THEN value END) as short_term_investments,
    MAX(CASE WHEN tag IN ('AccountsReceivableNetCurrent', 'AccountsReceivableNet') AND ddate = period_yyyymmdd THEN value END) as accounts_receivable,
    MAX(CASE WHEN tag IN ('InventoryNet', 'Inventory') AND ddate = period_yyyymmdd THEN value END) as inventory,
    MAX(CASE WHEN tag = 'AssetsNoncurrent' AND ddate = period_yyyymmdd THEN value END) as noncurrent_assets,
    MAX(CASE WHEN tag = 'PropertyPlantAndEquipmentNet' AND ddate = period_yyyymmdd THEN value END) as ppe_net,
    
    MAX(CASE WHEN tag = 'Liabilities' AND ddate = period_yyyymmdd THEN value END) as liabilities,
    MAX(CASE WHEN tag = 'LiabilitiesCurrent' AND ddate = period_yyyymmdd THEN value END) as current_liabilities,
    MAX(CASE WHEN tag = 'AccountsPayableCurrent' AND ddate = period_yyyymmdd THEN value END) as accounts_payable,
    MAX(CASE WHEN tag IN ('ShortTermBorrowings', 'DebtCurrent') AND ddate = period_yyyymmdd THEN value END) as short_term_debt,
    MAX(CASE WHEN tag IN ('LongTermDebtNoncurrent', 'LongTermDebt') AND ddate = period_yyyymmdd THEN value END) as long_term_debt,
    MAX(CASE WHEN tag = 'LiabilitiesNoncurrent' AND ddate = period_yyyymmdd THEN value END) as noncurrent_liabilities,
    
    -- CORRECCIÓN: Calcular StockholdersEquity como LiabilitiesAndStockholdersEquity - Liabilities si está disponible
    -- Esto asegura que Assets = Liabilities + StockholdersEquity
    COALESCE(
      MAX(CASE WHEN tag = 'LiabilitiesAndStockholdersEquity' AND ddate = period_yyyymmdd THEN value END) 
        - MAX(CASE WHEN tag = 'Liabilities' AND ddate = period_yyyymmdd THEN value END),
      MAX(CASE WHEN tag IN ('StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest') AND ddate = period_yyyymmdd THEN value END)
    ) as stockholders_equity,
    MAX(CASE WHEN tag = 'RetainedEarningsAccumulatedDeficit' AND ddate = period_yyyymmdd THEN value END) as retained_earnings
    
  FROM base_data
  WHERE qtrs = 0  -- Balance sheet = instant (point in time)
  GROUP BY ticker, cik, fiscal_year, fiscal_period, period_end_date  -- CORRECCIÓN: Remover adsh del GROUP BY para evitar duplicados
  ;
  
  SELECT COUNT(*) as balance_sheet_pivot_rows FROM balance_sheet_pivot;
  
  -- =========================================================================
  -- CTE 4: PIVOT CASH FLOW TAGS
  -- =========================================================================
  
  CREATE TEMP TABLE cash_flow_pivot AS
  SELECT
    ticker,
    cik,
    fiscal_year,
    fiscal_period,
    period_end_date,
    adsh,
    
    -- Cash Flow fields
    MAX(CASE WHEN tag = 'NetCashProvidedByUsedInOperatingActivities' THEN value END) as operating_cash_flow,
    MAX(CASE WHEN tag = 'NetCashProvidedByUsedInInvestingActivities' THEN value END) as investing_cash_flow,
    MAX(CASE WHEN tag = 'NetCashProvidedByUsedInFinancingActivities' THEN value END) as financing_cash_flow,
    MAX(CASE WHEN tag = 'PaymentsToAcquirePropertyPlantAndEquipment' THEN value END) as capex,
    MAX(CASE WHEN tag IN ('PaymentsOfDividends', 'PaymentsOfDividendsCommonStock') THEN value END) as dividends_paid
    
  FROM base_data
  WHERE qtrs IN (1, 4)  -- Cash flow = period (1=Q, 4=annual)
  GROUP BY ticker, cik, fiscal_year, fiscal_period, period_end_date, adsh
  ;
  
  SELECT COUNT(*) as cash_flow_pivot_rows FROM cash_flow_pivot;
  
  -- =========================================================================
  -- CTE 4.5: SHARES FROM NUM (NUEVO)
  -- =========================================================================
  
  CREATE TEMP TABLE shares_from_num AS
  SELECT
    n.adsh,
    
    -- Shares consolidado con prioridad
    CAST(COALESCE(
      MAX(CASE WHEN n.tag = 'WeightedAverageNumberOfDilutedSharesOutstanding' THEN n.value END),
      MAX(CASE WHEN n.tag = 'WeightedAverageNumberOfSharesOutstandingBasic' THEN n.value END),
      MAX(CASE WHEN n.tag = 'CommonStockSharesOutstanding' THEN n.value END),
      MAX(CASE WHEN n.tag = 'SharesOutstanding' THEN n.value END)
    ) AS INT64) as shares_outstanding_consolidated,
    
    -- Identificar source
    CASE
      WHEN MAX(CASE WHEN n.tag = 'WeightedAverageNumberOfDilutedSharesOutstanding' THEN 1 END) = 1 THEN 'diluted'
      WHEN MAX(CASE WHEN n.tag = 'WeightedAverageNumberOfSharesOutstandingBasic' THEN 1 END) = 1 THEN 'basic'
      WHEN MAX(CASE WHEN n.tag = 'CommonStockSharesOutstanding' THEN 1 END) = 1 THEN 'common'
      WHEN MAX(CASE WHEN n.tag = 'SharesOutstanding' THEN n.value END) IS NOT NULL THEN 'generic'
    END as shares_source_num
    
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.Num` n
  WHERE n.tag IN (
    'WeightedAverageNumberOfDilutedSharesOutstanding',
    'WeightedAverageNumberOfSharesOutstandingBasic',
    'CommonStockSharesOutstanding',
    'SharesOutstanding'
  )
    AND n.value > 0
  GROUP BY n.adsh
  ;
  
  SELECT COUNT(*) as shares_from_num_rows FROM shares_from_num;
  
  -- =========================================================================
  -- CTE 5: COMBINE ALL + CALCULATE Q4
  -- =========================================================================
  
  CREATE TEMP TABLE combined_statements AS
  SELECT
    -- Identity
    isp.ticker,
    isp.cik,
    isp.company_name,
    isp.fiscal_year,
    isp.fiscal_period,
    isp.period_end_date,
    CASE 
      WHEN isp.fiscal_year_end_mmdd IS NOT NULL 
      THEN CAST(isp.fiscal_year_end_mmdd AS STRING)
      ELSE NULL
    END as fiscal_year_end,
    isp.period_type,
    isp.form_type,
    isp.filing_date,
    
    -- Flag calculated
    FALSE as is_calculated,
    
    -- Income Statement
    isp.revenues,
    isp.cost_of_revenue,
    isp.gross_profit,
    isp.operating_expenses,
    isp.research_development,
    isp.selling_general_admin,
    isp.operating_income,
    isp.interest_expense,
    isp.interest_income,
    isp.other_income_expense,
    isp.income_before_tax,
    isp.income_tax_expense,
    isp.net_income,
    isp.eps_basic,
    isp.eps_diluted,
    isp.shares_outstanding_basic,
    isp.shares_outstanding_diluted,
    -- Shares outstanding (prioridad: Num extraído > nativo)
    COALESCE(sfn.shares_outstanding_consolidated, isp.shares_outstanding_diluted, isp.shares_outstanding_basic) 
      as shares_outstanding_consolidated,
    COALESCE(
      CASE WHEN sfn.shares_outstanding_consolidated IS NOT NULL THEN sfn.shares_source_num END,
      CASE WHEN isp.shares_outstanding_diluted IS NOT NULL THEN 'native_diluted' END,
      CASE WHEN isp.shares_outstanding_basic IS NOT NULL THEN 'native_basic' END
    ) as shares_source,
    
    -- Balance Sheet
    bsp.assets,
    bsp.current_assets,
    bsp.cash_and_equivalents,
    bsp.short_term_investments,
    bsp.accounts_receivable,
    bsp.inventory,
    bsp.noncurrent_assets,
    bsp.ppe_net,
    bsp.liabilities,
    bsp.current_liabilities,
    bsp.accounts_payable,
    bsp.short_term_debt,
    bsp.long_term_debt,
    bsp.noncurrent_liabilities,
    bsp.stockholders_equity,
    bsp.retained_earnings,
    
    -- Cash Flow
    cfp.operating_cash_flow,
    cfp.investing_cash_flow,
    cfp.financing_cash_flow,
    cfp.capex,
    -- Calculate FCF
    COALESCE(cfp.operating_cash_flow, 0) + COALESCE(cfp.capex, 0) as free_cash_flow,
    cfp.dividends_paid,
    
    -- Data quality (% of non-null key fields)
    (
      (CASE WHEN isp.revenues IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN isp.net_income IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN bsp.assets IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN bsp.stockholders_equity IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN cfp.operating_cash_flow IS NOT NULL THEN 1 ELSE 0 END)
    ) / 5.0 as data_quality_score
    
  FROM income_statement_pivot isp
  LEFT JOIN balance_sheet_pivot bsp 
    ON isp.ticker = bsp.ticker 
    AND isp.fiscal_year = bsp.fiscal_year 
    AND isp.fiscal_period = bsp.fiscal_period
  LEFT JOIN cash_flow_pivot cfp
    ON isp.ticker = cfp.ticker 
    AND isp.fiscal_year = cfp.fiscal_year 
    AND isp.fiscal_period = cfp.fiscal_period
  LEFT JOIN shares_from_num sfn
    ON isp.adsh = sfn.adsh
  
  UNION ALL
  
  -- Q4_CALC: Usar CTE simplificado para evitar problemas de GROUP BY
  SELECT
    q4.ticker,
    q4.cik,
    q4.company_name,
    q4.fiscal_year,
    q4.fiscal_period,
    q4.period_end_date,
    q4.fiscal_year_end,
    q4.period_type,
    q4.form_type,
    q4.filing_date,
    q4.is_calculated,
    q4.revenues,
    q4.cost_of_revenue,
    q4.gross_profit,
    q4.operating_expenses,
    q4.research_development,
    q4.selling_general_admin,
    q4.operating_income,
    q4.interest_expense,
    q4.interest_income,
    q4.other_income_expense,
    q4.income_before_tax,
    q4.income_tax_expense,
    q4.net_income,
    q4.eps_basic,
    q4.eps_diluted,
    q4.shares_outstanding_basic,
    q4.shares_outstanding_diluted,
    q4.shares_outstanding_consolidated,
    q4.shares_source,
    q4.assets,
    q4.current_assets,
    q4.cash_and_equivalents,
    q4.short_term_investments,
    q4.accounts_receivable,
    q4.inventory,
    q4.noncurrent_assets,
    q4.ppe_net,
    q4.liabilities,
    q4.current_liabilities,
    q4.accounts_payable,
    q4.short_term_debt,
    q4.long_term_debt,
    q4.noncurrent_liabilities,
    q4.stockholders_equity,
    q4.retained_earnings,
    q4.operating_cash_flow,
    q4.investing_cash_flow,
    q4.financing_cash_flow,
    q4.capex,
    q4.free_cash_flow,
    q4.dividends_paid,
    q4.data_quality_score
  FROM (
    -- CTE simplificado para cálculo Q4
    WITH annual_data AS (
      SELECT 
        isp.ticker, isp.cik, isp.company_name, isp.fiscal_year,
        isp.period_end_date, isp.fiscal_year_end_mmdd, isp.form_type, isp.filing_date,
        isp.revenues, isp.cost_of_revenue, isp.gross_profit, isp.operating_expenses,
        isp.research_development, isp.selling_general_admin, isp.operating_income,
        isp.interest_expense, isp.interest_income, isp.other_income_expense,
        isp.income_before_tax, isp.income_tax_expense, isp.net_income,
        isp.eps_basic, isp.eps_diluted, isp.shares_outstanding_basic, isp.shares_outstanding_diluted,
        COALESCE(sfn.shares_outstanding_consolidated, isp.shares_outstanding_diluted, isp.shares_outstanding_basic) as shares_outstanding_consolidated,
        COALESCE(
          CASE WHEN sfn.shares_outstanding_consolidated IS NOT NULL THEN sfn.shares_source_num END,
          CASE WHEN isp.shares_outstanding_diluted IS NOT NULL THEN 'native_diluted' END,
          CASE WHEN isp.shares_outstanding_basic IS NOT NULL THEN 'native_basic' END
        ) as shares_source,
        bsp.assets, bsp.current_assets, bsp.cash_and_equivalents, bsp.short_term_investments,
        bsp.accounts_receivable, bsp.inventory, bsp.noncurrent_assets, bsp.ppe_net,
        bsp.liabilities, bsp.current_liabilities, bsp.accounts_payable, bsp.short_term_debt,
        bsp.long_term_debt, bsp.noncurrent_liabilities, bsp.stockholders_equity, bsp.retained_earnings,
        cfp.operating_cash_flow, cfp.investing_cash_flow, cfp.financing_cash_flow,
        cfp.capex, COALESCE(cfp.operating_cash_flow, 0) + COALESCE(cfp.capex, 0) as free_cash_flow,
        cfp.dividends_paid
      FROM income_statement_pivot isp
      LEFT JOIN balance_sheet_pivot bsp
        ON isp.ticker = bsp.ticker
        AND isp.fiscal_year = bsp.fiscal_year
        AND isp.fiscal_period = bsp.fiscal_period
      LEFT JOIN cash_flow_pivot cfp
        ON isp.ticker = cfp.ticker
        AND isp.fiscal_year = cfp.fiscal_year
        AND isp.fiscal_period = cfp.fiscal_period
      LEFT JOIN shares_from_num sfn
        ON isp.adsh = sfn.adsh
      WHERE isp.fiscal_period = 'FY'
    ),
    quarterly_sum AS (
      SELECT 
        isp.ticker, isp.fiscal_year,
        SUM(isp.revenues) as sum_revenues,
        SUM(isp.cost_of_revenue) as sum_cost_of_revenue,
        SUM(isp.gross_profit) as sum_gross_profit,
        SUM(isp.operating_expenses) as sum_operating_expenses,
        SUM(isp.research_development) as sum_research_development,
        SUM(isp.selling_general_admin) as sum_selling_general_admin,
        SUM(isp.operating_income) as sum_operating_income,
        SUM(isp.interest_expense) as sum_interest_expense,
        SUM(isp.interest_income) as sum_interest_income,
        SUM(isp.other_income_expense) as sum_other_income_expense,
        SUM(isp.income_before_tax) as sum_income_before_tax,
        SUM(isp.income_tax_expense) as sum_income_tax_expense,
        SUM(isp.net_income) as sum_net_income,
        SUM(cfp.operating_cash_flow) as sum_operating_cash_flow,
        SUM(cfp.investing_cash_flow) as sum_investing_cash_flow,
        SUM(cfp.financing_cash_flow) as sum_financing_cash_flow,
        SUM(cfp.capex) as sum_capex,
        SUM(COALESCE(cfp.operating_cash_flow, 0) + COALESCE(cfp.capex, 0)) as sum_free_cash_flow,
        SUM(cfp.dividends_paid) as sum_dividends_paid
      FROM income_statement_pivot isp
      LEFT JOIN cash_flow_pivot cfp
        ON isp.ticker = cfp.ticker
        AND isp.fiscal_year = cfp.fiscal_year
        AND isp.fiscal_period = cfp.fiscal_period
      WHERE isp.fiscal_period IN ('Q1', 'Q2', 'Q3')
      GROUP BY isp.ticker, isp.fiscal_year
    )
    SELECT 
      a.ticker, a.cik, a.company_name, a.fiscal_year,
      'Q4_calc' as fiscal_period,
      a.period_end_date,
      CASE 
        WHEN a.fiscal_year_end_mmdd IS NOT NULL 
        THEN CAST(a.fiscal_year_end_mmdd AS STRING)
        ELSE NULL
      END as fiscal_year_end,
      'quarterly' as period_type,
      a.form_type,
      a.filing_date,
      TRUE as is_calculated,
      -- IS: Annual - sum(Q1,Q2,Q3)
      CASE WHEN a.revenues IS NOT NULL THEN a.revenues - COALESCE(q.sum_revenues, 0) ELSE NULL END as revenues,
      CASE WHEN a.cost_of_revenue IS NOT NULL THEN a.cost_of_revenue - COALESCE(q.sum_cost_of_revenue, 0) ELSE NULL END as cost_of_revenue,
      CASE WHEN a.gross_profit IS NOT NULL THEN a.gross_profit - COALESCE(q.sum_gross_profit, 0) ELSE NULL END as gross_profit,
      CASE WHEN a.operating_expenses IS NOT NULL THEN a.operating_expenses - COALESCE(q.sum_operating_expenses, 0) ELSE NULL END as operating_expenses,
      CASE WHEN a.research_development IS NOT NULL THEN a.research_development - COALESCE(q.sum_research_development, 0) ELSE NULL END as research_development,
      CASE WHEN a.selling_general_admin IS NOT NULL THEN a.selling_general_admin - COALESCE(q.sum_selling_general_admin, 0) ELSE NULL END as selling_general_admin,
      CASE WHEN a.operating_income IS NOT NULL THEN a.operating_income - COALESCE(q.sum_operating_income, 0) ELSE NULL END as operating_income,
      CASE WHEN a.interest_expense IS NOT NULL THEN a.interest_expense - COALESCE(q.sum_interest_expense, 0) ELSE NULL END as interest_expense,
      CASE WHEN a.interest_income IS NOT NULL THEN a.interest_income - COALESCE(q.sum_interest_income, 0) ELSE NULL END as interest_income,
      CASE WHEN a.other_income_expense IS NOT NULL THEN a.other_income_expense - COALESCE(q.sum_other_income_expense, 0) ELSE NULL END as other_income_expense,
      CASE WHEN a.income_before_tax IS NOT NULL THEN a.income_before_tax - COALESCE(q.sum_income_before_tax, 0) ELSE NULL END as income_before_tax,
      CASE WHEN a.income_tax_expense IS NOT NULL THEN a.income_tax_expense - COALESCE(q.sum_income_tax_expense, 0) ELSE NULL END as income_tax_expense,
      CASE WHEN a.net_income IS NOT NULL THEN a.net_income - COALESCE(q.sum_net_income, 0) ELSE NULL END as net_income,
      -- EPS: usar annual (no se puede restar quarters)
      a.eps_basic, a.eps_diluted, a.shares_outstanding_basic, a.shares_outstanding_diluted,
      a.shares_outstanding_consolidated, a.shares_source,
      -- BS: usar annual end-of-year snapshot
      a.assets, a.current_assets, a.cash_and_equivalents, a.short_term_investments,
      a.accounts_receivable, a.inventory, a.noncurrent_assets, a.ppe_net,
      a.liabilities, a.current_liabilities, a.accounts_payable, a.short_term_debt,
      a.long_term_debt, a.noncurrent_liabilities, a.stockholders_equity, a.retained_earnings,
      -- CF: Annual - sum(Q1,Q2,Q3)
      CASE WHEN a.operating_cash_flow IS NOT NULL THEN a.operating_cash_flow - COALESCE(q.sum_operating_cash_flow, 0) ELSE NULL END as operating_cash_flow,
      CASE WHEN a.investing_cash_flow IS NOT NULL THEN a.investing_cash_flow - COALESCE(q.sum_investing_cash_flow, 0) ELSE NULL END as investing_cash_flow,
      CASE WHEN a.financing_cash_flow IS NOT NULL THEN a.financing_cash_flow - COALESCE(q.sum_financing_cash_flow, 0) ELSE NULL END as financing_cash_flow,
      CASE WHEN a.capex IS NOT NULL THEN a.capex - COALESCE(q.sum_capex, 0) ELSE NULL END as capex,
      CASE WHEN a.free_cash_flow IS NOT NULL THEN a.free_cash_flow - COALESCE(q.sum_free_cash_flow, 0) ELSE NULL END as free_cash_flow,
      CASE WHEN a.dividends_paid IS NOT NULL THEN a.dividends_paid - COALESCE(q.sum_dividends_paid, 0) ELSE NULL END as dividends_paid,
      -- Data quality score
      (
        (CASE WHEN a.revenues IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN a.net_income IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN a.assets IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN a.stockholders_equity IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN a.operating_cash_flow IS NOT NULL THEN 1 ELSE 0 END)
      ) / 5.0 * 0.8 as data_quality_score
      FROM annual_data a
      LEFT JOIN quarterly_sum q 
        ON a.ticker = q.ticker 
        AND a.fiscal_year = q.fiscal_year
    WHERE a.revenues IS NOT NULL  -- Solo calcular si hay annual data
  ) q4
  ;
  
  SELECT COUNT(*) as combined_statements_rows FROM combined_statements;
  
  -- =========================================================================
  -- STEP 6: INSERT TO fundamentals_timeseries (TRUNCATE + INSERT)
  -- =========================================================================
  
  -- Truncate existing data (idempotente)
  TRUNCATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`;
  
  -- Insert all data with EXPLICIT column names to ensure correct mapping
  INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` (
    ticker,
    cik,
    company_name,
    fiscal_year,
    fiscal_period,
    period_end_date,
    fiscal_year_end,
    is_calculated,
    period_type,
    form_type,
    filing_date,
    revenues,
    cost_of_revenue,
    gross_profit,
    operating_expenses,
    research_development,
    selling_general_admin,
    operating_income,
    interest_expense,
    interest_income,
    other_income_expense,
    income_before_tax,
    income_tax_expense,
    net_income,
    eps_basic,
    eps_diluted,
    shares_outstanding_basic,
    shares_outstanding_diluted,
    shares_outstanding_consolidated,
    shares_source,
    assets,
    current_assets,
    cash_and_equivalents,
    short_term_investments,
    accounts_receivable,
    inventory,
    noncurrent_assets,
    ppe_net,
    liabilities,
    current_liabilities,
    accounts_payable,
    short_term_debt,
    long_term_debt,
    noncurrent_liabilities,
    stockholders_equity,
    retained_earnings,
    operating_cash_flow,
    investing_cash_flow,
    financing_cash_flow,
    capex,
    free_cash_flow,
    dividends_paid,
    data_quality_score,
    last_updated
  )
  SELECT 
    CAST(ticker AS STRING),
    CAST(cik AS INT64),
    CAST(company_name AS STRING),
    CAST(fiscal_year AS INT64),
    CAST(fiscal_period AS STRING),
    CAST(period_end_date AS DATE),
    CAST(fiscal_year_end AS STRING),
    CAST(is_calculated AS BOOL),
    CAST(period_type AS STRING),
    CAST(form_type AS STRING),
    CAST(filing_date AS DATE),
    -- Income Statement (FLOAT64)
    CAST(revenues AS FLOAT64),
    CAST(cost_of_revenue AS FLOAT64),
    CAST(gross_profit AS FLOAT64),
    CAST(operating_expenses AS FLOAT64),
    CAST(research_development AS FLOAT64),
    CAST(selling_general_admin AS FLOAT64),
    CAST(operating_income AS FLOAT64),
    CAST(interest_expense AS FLOAT64),
    CAST(interest_income AS FLOAT64),
    CAST(other_income_expense AS FLOAT64),
    CAST(income_before_tax AS FLOAT64),
    CAST(income_tax_expense AS FLOAT64),
    CAST(net_income AS FLOAT64),
    CAST(eps_basic AS FLOAT64),
    CAST(eps_diluted AS FLOAT64),
    -- Shares (FLOAT64 según schema para basic/diluted, INT64 para consolidated)
    CAST(shares_outstanding_basic AS FLOAT64),
    CAST(shares_outstanding_diluted AS FLOAT64),
    CAST(shares_outstanding_consolidated AS INT64),
    CAST(shares_source AS STRING),
    -- Balance Sheet (FLOAT64)
    CAST(assets AS FLOAT64),
    CAST(current_assets AS FLOAT64),
    CAST(cash_and_equivalents AS FLOAT64),
    CAST(short_term_investments AS FLOAT64),
    CAST(accounts_receivable AS FLOAT64),
    CAST(inventory AS FLOAT64),
    CAST(noncurrent_assets AS FLOAT64),
    CAST(ppe_net AS FLOAT64),
    CAST(liabilities AS FLOAT64),
    CAST(current_liabilities AS FLOAT64),
    CAST(accounts_payable AS FLOAT64),
    CAST(short_term_debt AS FLOAT64),
    CAST(long_term_debt AS FLOAT64),
    CAST(noncurrent_liabilities AS FLOAT64),
    CAST(stockholders_equity AS FLOAT64),
    CAST(retained_earnings AS FLOAT64),
    -- Cash Flow (FLOAT64)
    CAST(operating_cash_flow AS FLOAT64),
    CAST(investing_cash_flow AS FLOAT64),
    CAST(financing_cash_flow AS FLOAT64),
    CAST(capex AS FLOAT64),
    CAST(free_cash_flow AS FLOAT64),
    CAST(dividends_paid AS FLOAT64),
    CAST(data_quality_score AS FLOAT64),
    CAST(last_refresh_time AS TIMESTAMP)
  FROM combined_statements
  WHERE data_quality_score >= 0.4
  ;
  
  SELECT CONCAT('✅ Inserted ', CAST(@@row_count AS STRING), ' rows to fundamentals_timeseries') as log_message;
  
  -- =========================================================================
  -- STEP 7: CALCULATE RATIOS → fundamentals_ratios
  -- =========================================================================
  
  -- CTE: Latest prices for each ticker
  CREATE TEMP TABLE latest_prices AS
  SELECT 
    REPLACE(REPLACE(ticker, '.US', ''), '.us', '') as ticker,
    close as latest_close,
    fecha as latest_date
  FROM (
    SELECT 
      ticker,
      close,
      fecha,
      ROW_NUMBER() OVER (PARTITION BY REPLACE(REPLACE(ticker, '.US', ''), '.us', '') ORDER BY fecha DESC) as rn
    FROM `sunny-advantage-471523-b3.market_data.Prices`
  )
  WHERE rn = 1
  ;
  
  TRUNCATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios`;
  
  INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios`
  SELECT
    ft.ticker,
    ft.cik,
    ft.company_name,
    ft.fiscal_year,
    ft.fiscal_period,
    ft.period_end_date,
    ft.period_type,
    
    -- PROFITABILITY RATIOS
    SAFE_DIVIDE(ft.gross_profit, ft.revenues) as gross_margin,
    SAFE_DIVIDE(ft.operating_income, ft.revenues) as operating_margin,
    SAFE_DIVIDE(ft.net_income, ft.revenues) as net_margin,
    SAFE_DIVIDE(ft.net_income, ft.stockholders_equity) as roe,
    SAFE_DIVIDE(ft.net_income, ft.assets) as roa,
    SAFE_DIVIDE(ft.net_income, (ft.assets - ft.current_liabilities)) as roic,  -- Simplified ROIC
    
    -- LIQUIDITY RATIOS
    SAFE_DIVIDE(ft.current_assets, ft.current_liabilities) as current_ratio,
    SAFE_DIVIDE((ft.current_assets - ft.inventory), ft.current_liabilities) as quick_ratio,
    SAFE_DIVIDE(ft.cash_and_equivalents, ft.current_liabilities) as cash_ratio,
    ft.current_assets - ft.current_liabilities as working_capital,
    
    -- LEVERAGE RATIOS
    SAFE_DIVIDE((ft.short_term_debt + ft.long_term_debt), ft.stockholders_equity) as debt_to_equity,
    SAFE_DIVIDE((ft.short_term_debt + ft.long_term_debt), ft.assets) as debt_to_assets,
    SAFE_DIVIDE(ft.stockholders_equity, ft.assets) as equity_ratio,
    SAFE_DIVIDE(ft.operating_income, ft.interest_expense) as interest_coverage,
    
    -- EFFICIENCY RATIOS
    SAFE_DIVIDE(ft.revenues, ft.assets) as asset_turnover,
    SAFE_DIVIDE(ft.cost_of_revenue, ft.inventory) as inventory_turnover,
    SAFE_DIVIDE(ft.revenues, ft.accounts_receivable) as receivables_turnover,
    SAFE_DIVIDE(365, SAFE_DIVIDE(ft.revenues, ft.accounts_receivable)) as days_sales_outstanding,
    
    -- CASH FLOW RATIOS
    SAFE_DIVIDE(ft.free_cash_flow, ft.revenues) as fcf_margin,
    SAFE_DIVIDE(ft.operating_cash_flow, ft.current_liabilities) as operating_cf_ratio,
    SAFE_DIVIDE(ft.operating_cash_flow, (ft.short_term_debt + ft.long_term_debt)) as cash_flow_to_debt,
    SAFE_DIVIDE(ABS(ft.capex), ft.revenues) as capex_to_revenue,
    
    -- VALUATION RATIOS (calculate with latest price)
    SAFE_DIVIDE(
      lp.latest_close * ft.shares_outstanding_consolidated,
      ft.net_income * 1000000
    ) as price_to_earnings,
    
    SAFE_DIVIDE(
      lp.latest_close * ft.shares_outstanding_consolidated,
      ft.stockholders_equity * 1000000
    ) as price_to_book,
    
    SAFE_DIVIDE(
      lp.latest_close * ft.shares_outstanding_consolidated,
      ft.revenues * 1000000
    ) as price_to_sales,
    
    SAFE_DIVIDE(
      SAFE_DIVIDE(
        lp.latest_close * ft.shares_outstanding_consolidated,
        ft.net_income * 1000000
      ),
      NULLIF(
        SAFE_DIVIDE(
          (ft.eps_diluted - LAG(ft.eps_diluted, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)),
          LAG(ft.eps_diluted, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)
        ) * 100,
        0
      )
    ) as peg_ratio,
    
    -- GROWTH METRICS YoY (calculate from lagged data)
    SAFE_DIVIDE(
      (ft.revenues - LAG(ft.revenues, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)),
      LAG(ft.revenues, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)
    ) * 100 as revenue_growth_yoy,
    
    SAFE_DIVIDE(
      (ft.net_income - LAG(ft.net_income, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)),
      LAG(ft.net_income, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)
    ) * 100 as net_income_growth_yoy,
    
    SAFE_DIVIDE(
      (ft.eps_diluted - LAG(ft.eps_diluted, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)),
      LAG(ft.eps_diluted, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)
    ) * 100 as eps_growth_yoy,
    
    SAFE_DIVIDE(
      (ft.free_cash_flow - LAG(ft.free_cash_flow, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)),
      LAG(ft.free_cash_flow, 1) OVER (PARTITION BY ft.ticker, ft.fiscal_period ORDER BY ft.fiscal_year)
    ) * 100 as fcf_growth_yoy,
    
    -- Data quality
    ft.data_quality_score,
    ft.last_updated
    
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` ft
  LEFT JOIN latest_prices lp ON ft.ticker = lp.ticker
  WHERE ft.fiscal_period IN ('Q1', 'Q2', 'Q3', 'Q4_calc', 'FY')  -- All periods
  ;
  
  SELECT CONCAT('✅ Inserted ', CAST(@@row_count AS STRING), ' rows to fundamentals_ratios') as log_message;
  
  -- =========================================================================
  -- FINAL LOG
  -- =========================================================================
  SELECT CONCAT('✅ Refresh completado: ', CAST(CURRENT_TIMESTAMP() AS STRING)) as log_message;
  
END