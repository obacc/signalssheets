# SignalsSheets Excel - Guía de Uso

## 📦 Archivos Generados

Este directorio contiene:

1. **SignalsSheets_FREE.xlsm** (18KB) - Tier gratuito con 10 watchlist slots
2. **SignalsSheets_BASICO.xlsm** (22KB) - Tier básico con 25 watchlist slots + features avanzadas
3. **create_signalssheets.py** - Script Python generador

## 🎯 ¿Qué está incluido?

### ✅ IMPLEMENTADO AUTOMÁTICAMENTE

#### Hojas Ocultas (Ambos tiers)
- **Config** - Configuración API, token, tier, email
- **DATA_Signals** - Tabla con 5 señales dummy (NVDA, AAPL, MSFT, GOOGL, TSLA)
- **DATA_Prices** - Tabla con precios actualizados
- **DATA_Context** - Métricas de mercado (regime, breadth, win rate)

#### Hojas Visibles - FREE (10 hojas)
1. **Dashboard** - KPI cards + TOP 5 señales + Banner upgrade
2. **Mi Watchlist** - 10 slots con fórmulas XLOOKUP automáticas
3. **TOP Señales** - Placeholder
4. **Índices & ETFs** - Placeholder
5. **Metodología Trinity** - Placeholder
6. **Videos Educativos** - Placeholder

#### Hojas Visibles - BASICO (14 hojas)
- Todas las de FREE +
- **Mi Watchlist** ampliada (25 filas) con columnas adicionales:
  - Entrada, Stop, Target, P/L, %Gain, Días, R/R
- **Trade Execution Helper** - Placeholder
- **Portfolio Manager** - Placeholder
- **Análisis Individual** - Placeholder
- **Market Context** - Placeholder

#### Características Técnicas
- ✅ Brand Kit colors (Azul Índigo primary, Verde success, Rojo danger)
- ✅ Tables con nombres: tbl_Signals, tbl_Prices, tbl_Context
- ✅ Fórmulas XLOOKUP/INDEX funcionando
- ✅ Datos dummy realistas
- ✅ Headers con merge y formato
- ✅ KPI cards en Dashboard
- ✅ Hoja con código VBA listo para copiar

### ⚠️ PENDIENTE (Configuración Manual)

#### 1. Power Query (CRÍTICO)
**No puede agregarse programáticamente con Python/openpyxl**

**Cómo agregarlo:**
1. Abrir archivo Excel
2. `Data` → `Get Data` → `From Other Sources` → `Blank Query`
3. Pegar código M de las queries (ver Day1_FINAL guide)
4. Crear 3 queries:
   - `Query_Signals` → tabla tbl_Signals
   - `Query_Prices` → tabla tbl_Prices
   - `Query_Context` → tabla tbl_Context

**Queries necesarias:**
```m
// Query_Signals
let
    Source = Json.Document(Web.Contents(
        API_Base & "/signals",
        [Headers=[Authorization="Bearer " & API_Token]]
    )),
    ToTable = Table.FromList(Source, Splitter.SplitByNothing())
in
    ToTable
```

*(Adaptar según tu API real de Cloudflare)*

#### 2. VBA Code (IMPORTANTE)

**Incluido en hoja `_VBA_CODE_` dentro de cada archivo**

**Cómo importarlo:**
1. Abrir Excel
2. `Alt+F11` (VBA Editor)
3. Insert → Module
4. Ir a hoja `_VBA_CODE_` en Excel
5. Copiar todo el código
6. Pegar en Module1
7. Cerrar VBA Editor
8. Eliminar hoja `_VBA_CODE_`

**Macros incluidas:**
- `RefreshAllQueries()` - Actualiza datos desde Cloudflare
- `MakeVeryHidden()` - Oculta hojas Config y DATA_*

#### 3. Named Ranges (IMPORTANTE)

**Agregar manualmente:**
1. `Formulas` → `Name Manager` → `New`
2. Crear:
   - `API_Token` = Config!$B$1
   - `API_Base` = Config!$B$2
   - `User_Tier` = Config!$B$3
   - `User_Email` = Config!$B$4

#### 4. Protección de Hojas (IMPORTANTE)

**Mi Watchlist:**
1. Seleccionar todas las celdas → `Format Cells` → `Protection` → ☑️ Locked
2. Seleccionar B10:B19 (FREE) o B10:B34 (BASICO) → `Format Cells` → `Protection` → ☐ Locked
3. Seleccionar I10:I19 (FREE) o I10:I34 (BASICO) → `Format Cells` → `Protection` → ☐ Locked
4. BASICO: También desbloquear K10:K34
5. `Review` → `Protect Sheet` → Sin password → OK

#### 5. Ocultar Hojas DATA (IMPORTANTE)

**Opción A - Con VBA:**
1. Ejecutar macro `MakeVeryHidden` (después de importar VBA)

**Opción B - Manual:**
1. Right-click en pestaña "Config" → Hide
2. Right-click en pestaña "DATA_Signals" → Hide
3. Right-click en pestaña "DATA_Prices" → Hide
4. Right-click en pestaña "DATA_Context" → Hide

*(Very Hidden solo disponible via VBA)*

#### 6. Conditional Formatting (OPCIONAL)

**Columna Signal en Dashboard:**
1. Seleccionar rango de señales (C18:C22 para FREE)
2. `Home` → `Conditional Formatting` → `New Rule`
3. "Format cells that contain" → "Specific Text" → "BUY"
4. Format: Fill = Verde claro (RGB 16, 185, 129 con alpha)
5. Repetir para:
   - "HOLD" → Amarillo claro
   - "SELL" → Rojo claro

#### 7. Hyperlinks (OPCIONAL)

**Botones Broker:**
- Column H "IB →" en Dashboard
- Agregar hyperlink a Interactive Brokers
- Template: `https://www.interactivebrokers.com/en/index.php?f=2222&exch=nasdaq&showcategories=STK&p=&page=1&q=NVDA`

**Upgrade button (FREE tier):**
- Cell B41 "🔓 Upgrade Ahora →"
- Link to pricing page

#### 8. Botón Actualizar Datos (OPCIONAL)

**Después de importar VBA:**
1. `Developer` → `Insert` → `Button (Form Control)`
2. Dibujar en celda A4 del Dashboard
3. Asignar macro `RefreshAllQueries`
4. Texto: "🔄 Actualizar Datos"

## 🚀 Cómo Usar

### Para Desarrollo
```bash
# Regenerar archivos
python3 create_signalssheets.py

# Esto crea:
# - SignalsSheets_FREE.xlsm
# - SignalsSheets_BASICO.xlsm
```

### Para Distribución
1. Completar los pasos manuales arriba
2. Configurar API token real en Config!B1
3. Configurar API base URL en Config!B2
4. Probar refresh de datos
5. Eliminar hoja `_VBA_CODE_`
6. Distribuir archivo

## 📊 Estructura de Datos

### Tabla: tbl_Signals
| Campo | Tipo | Descripción |
|-------|------|-------------|
| ticker | text | Símbolo del activo |
| company | text | Nombre de empresa |
| sector | text | Sector |
| signal | text | BUY/HOLD/SELL |
| trinity_score | number | Score 0-100 |
| lynch_score | number | Score Lynch |
| oneil_score | number | Score O'Neil |
| graham_score | number | Score Graham |
| price | number | Precio actual |
| target | number | Precio objetivo |
| stop_loss | number | Stop loss |
| tp1, tp2 | number | Take profits |
| potential_return | number | % retorno esperado |
| risk_reward | number | Ratio R/R |
| author_dominant | text | Autor dominante |
| updated_at | datetime | Timestamp |

### Tabla: tbl_Prices
| Campo | Tipo | Descripción |
|-------|------|-------------|
| ticker | text | Símbolo |
| price | number | Precio |
| change | number | Cambio absoluto |
| change_percent | number | Cambio % |
| volume | number | Volumen |
| updated_at | datetime | Timestamp |

### Tabla: tbl_Context
| Key | Value | Descripción |
|-----|-------|-------------|
| market_regime | text | bull/neutral/bear |
| regime_confidence | number | Confianza 0-1 |
| breadth_sma50 | number | % sobre SMA50 |
| breadth_sma200 | number | % sobre SMA200 |
| signals_count | number | Total señales |
| win_rate_30d | number | Win rate 30d |
| avg_return_30d | number | Retorno promedio |

## 🎨 Brand Kit

```python
COLORS = {
    'primary': 'FF1E3A8A',      # Azul Índigo (30, 58, 138)
    'success': 'FF10B981',      # Verde Señal (16, 185, 129)
    'danger': 'FFEF4444',       # Rojo Alerta (239, 68, 68)
    'warning': 'FFF59E0B',      # Amarillo (245, 158, 11)
    'text_primary': 'FF1E293B', # Texto principal
    'text_secondary': 'FF64748B', # Texto secundario
    'bg_light': 'FFF8FAFC',     # Background claro
    'border': 'FFE2E8F0'        # Borders
}
```

## 🔧 Troubleshooting

### "Fórmulas muestran #NAME?"
- Excel en español: Cambiar XLOOKUP → BUSCARX
- Excel en inglés: Mantener XLOOKUP
- Verificar que las tablas existen (tbl_Signals, tbl_Prices, tbl_Context)

### "No se actualizan los datos"
- Verificar que Power Query esté configurado
- Verificar token en Config!B1
- Ejecutar macro RefreshAllQueries
- Revisar Data → Queries & Connections

### "Celdas protegidas no editables"
- Verificar que columnas B e I están desbloqueadas
- Review → Unprotect Sheet → Editar → Protect Sheet

### "VBA no funciona"
- File → Options → Trust Center → Trust Center Settings
- Macro Settings → Enable all macros
- Reiniciar Excel

## 📝 Notas Técnicas

### Limitaciones de openpyxl
Python/openpyxl **no puede** crear:
- ❌ Power Query connections
- ❌ VBA code automáticamente en el proyecto
- ❌ Named Ranges complejos
- ❌ Conditional Formatting avanzado
- ❌ Botones de formulario
- ❌ Very Hidden sheets (solo Hidden)

Por eso estos elementos deben agregarse **manualmente** en Excel.

### ¿Por qué XLSM si no tiene VBA integrado?
El formato .xlsm está preparado para macros, pero el código VBA debe:
1. Copiarse desde hoja `_VBA_CODE_`
2. Importarse manualmente al VBA Editor
3. Guardarse en el archivo

No hay forma de inyectar VBA programáticamente de forma segura.

## 📞 Soporte

Para problemas con:
- **Script Python**: Ver código fuente en `create_signalssheets.py`
- **Estructura Excel**: Verificar hojas y tablas creadas
- **Power Query**: Consultar documentación de Cloudflare API
- **VBA**: Ver código en hoja `_VBA_CODE_`

## 🎯 Checklist de Producción

Antes de distribuir a usuarios:

- [ ] Power Query configurado con API real
- [ ] VBA code importado y probado
- [ ] Named Ranges creados (API_Token, API_Base, etc.)
- [ ] Hojas DATA_ configuradas como Very Hidden
- [ ] Protección en Mi Watchlist configurada
- [ ] Conditional Formatting aplicado
- [ ] Botón "Actualizar Datos" funcionando
- [ ] Hyperlinks a brokers agregados (opcional)
- [ ] Hoja `_VBA_CODE_` eliminada
- [ ] Token real en Config (no placeholder)
- [ ] Probado refresh de datos desde Cloudflare
- [ ] Fórmulas traducidas si Excel en español
- [ ] File → Save As → SignalsSheets_[TIER]_v1.0.0.xlsm

---

**Creado por:** create_signalssheets.py
**Versión:** 1.0.0
**Fecha:** 2025-10-27
