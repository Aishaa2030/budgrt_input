import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { analyzeProject, inspectDataQuality, summarizeProjects, sumFiniteAmounts } from './budgetAnalytics'
import './App.css'

type OutageType = 'Outage' | 'Not outage'
type ProjectStatus = 'معتمد' | 'قيد المراجعة' | 'مطلوب تحديث' | 'مؤجل'
type View = 'overview' | 'projects'

type FinancialYear = {
  year: number
  amount: number
  note: string
}

type Project = {
  id: string
  no: string
  outage: OutageType
  workDescription: string
  department: string
  askBudget27: number | null
  sourceBudget2026: number | null
  amount2027: number | null
  notes: string
  contractNo: string
  ecaCategory: string
  status: ProjectStatus
  financialHistory: FinancialYear[]
}

type ProjectForm = Omit<Project, 'id' | 'financialHistory' | 'askBudget27' | 'sourceBudget2026' | 'amount2027'> & {
  askBudget27: string
  sourceBudget2026: string
  amount2027: string
}

const statusOptions: ProjectStatus[] = ['معتمد', 'قيد المراجعة', 'مطلوب تحديث', 'مؤجل']
const departments = ['الهندسة', 'الصيانة', 'السلامة', 'المرافق', 'تقنية المعلومات']
const categories = ['CAPEX', 'OPEX', 'ECA-1', 'ECA-2']

type ProjectFilterBarProps = {
  searchValue: string
  departmentValue: string
  statusValue: string
  outageValue: string
  categoryValue: string
  active: boolean
  onSearchChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onStatusChange: (value: string) => void
  onOutageChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onClear: () => void
}

function ProjectFilterBar({
  searchValue,
  departmentValue,
  statusValue,
  outageValue,
  categoryValue,
  active,
  onSearchChange,
  onDepartmentChange,
  onStatusChange,
  onOutageChange,
  onCategoryChange,
  onClear,
}: ProjectFilterBarProps) {
  return (
    <div className="filter-grid">
      <label className="search-control project-search-control">
        <span className="sr-only">بحث باسم المشروع أو رقم العقد</span>
        <span className="search-symbol" aria-hidden="true">⌕</span>
        <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="اسم المشروع أو رقم العقد" />
      </label>
      <label className="select-control"><span className="sr-only">تصفية حسب القسم</span><select value={departmentValue} onChange={(event) => onDepartmentChange(event.target.value)}><option value="">كل الأقسام</option>{departments.map((department) => <option key={department}>{department}</option>)}</select></label>
      <label className="select-control"><span className="sr-only">تصفية حسب الحالة</span><select value={statusValue} onChange={(event) => onStatusChange(event.target.value)}><option value="">كل الحالات</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="select-control"><span className="sr-only">تصفية حسب نوع التوقف</span><select value={outageValue} onChange={(event) => onOutageChange(event.target.value)}><option value="">كل أنواع التوقف</option><option value="Outage">Outage</option><option value="Not outage">Not outage</option></select></label>
      <label className="select-control"><span className="sr-only">تصفية حسب ECA Category</span><select value={categoryValue} onChange={(event) => onCategoryChange(event.target.value)}><option value="">كل فئات ECA</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      {active && <button className="clear-filters" type="button" onClick={onClear}>مسح الفلاتر</button>}
    </div>
  )
}

const initialProjects: Project[] = [
  {
    id: 'project-001', no: '001', outage: 'Outage', workDescription: 'إعادة تأهيل مضخات مياه التبريد', department: 'الصيانة',
    askBudget27: 4850000, sourceBudget2026: 3200000, amount2027: 4100000, notes: 'التوريد مرتبط بنافذة التوقف القادمة.',
    contractNo: 'CT-24108', ecaCategory: 'ECA-1', status: 'قيد المراجعة',
    financialHistory: [{ year: 2024, amount: 1200000, note: 'دراسة وتصميم' }, { year: 2025, amount: 2100000, note: 'أعمال المرحلة الأولى' }, { year: 2026, amount: 3200000, note: 'المصدر المعتمد' }, { year: 2027, amount: 4100000, note: 'تقدير السنة القادمة' }],
  },
  {
    id: 'project-002', no: '002', outage: 'Not outage', workDescription: 'تحديث نظام التحكم للمبنى الإداري', department: 'تقنية المعلومات',
    askBudget27: 2180000, sourceBudget2026: 1650000, amount2027: 1980000, notes: 'يمكن التنفيذ دون التأثير على التشغيل.',
    contractNo: 'IT-25037', ecaCategory: 'CAPEX', status: 'معتمد',
    financialHistory: [{ year: 2024, amount: 460000, note: 'رفع المتطلبات' }, { year: 2025, amount: 910000, note: 'مرحلة التوريد' }, { year: 2026, amount: 1650000, note: 'المصدر المعتمد' }, { year: 2027, amount: 1980000, note: 'تقدير السنة القادمة' }],
  },
  {
    id: 'project-003', no: '003', outage: 'Outage', workDescription: 'استبدال صمامات خط البخار الرئيسي', department: 'الهندسة',
    askBudget27: 6300000, sourceBudget2026: 4400000, amount2027: 5200000, notes: 'مراجعة نطاق الأعمال مع فريق التشغيل.',
    contractNo: 'EN-23952', ecaCategory: 'ECA-2', status: 'مطلوب تحديث',
    financialHistory: [{ year: 2024, amount: 1800000, note: 'فحص فني' }, { year: 2025, amount: 3100000, note: 'تصميم النطاق' }, { year: 2026, amount: 4400000, note: 'المصدر المعتمد' }, { year: 2027, amount: 5200000, note: 'تقدير السنة القادمة' }],
  },
  {
    id: 'project-004', no: '004', outage: 'Not outage', workDescription: 'تحسين كفاءة وحدات التكييف', department: 'المرافق',
    askBudget27: 1720000, sourceBudget2026: 1250000, amount2027: 1460000, notes: 'يتطلب تحديث دراسة استهلاك الطاقة.',
    contractNo: 'FM-25114', ecaCategory: 'OPEX', status: 'قيد المراجعة',
    financialHistory: [{ year: 2024, amount: 350000, note: 'قياس الاستهلاك' }, { year: 2025, amount: 720000, note: 'تجربة أولية' }, { year: 2026, amount: 1250000, note: 'المصدر المعتمد' }, { year: 2027, amount: 1460000, note: 'تقدير السنة القادمة' }],
  },
  {
    id: 'project-005', no: '005', outage: 'Outage', workDescription: 'فحص وإصلاح خزان الوقود الاحتياطي', department: 'السلامة',
    askBudget27: 2940000, sourceBudget2026: 1950000, amount2027: 2320000, notes: 'بانتظار اعتماد خطة العزل.',
    contractNo: 'HS-24066', ecaCategory: 'ECA-1', status: 'مؤجل',
    financialHistory: [{ year: 2024, amount: 680000, note: 'تقييم الحالة' }, { year: 2025, amount: 1210000, note: 'إعداد المواصفات' }, { year: 2026, amount: 1950000, note: 'المصدر المعتمد' }, { year: 2027, amount: 2320000, note: 'تقدير السنة القادمة' }],
  },
  {
    id: 'project-006', no: '006', outage: 'Not outage', workDescription: 'توسعة شبكة الهواء المضغوط', department: 'الهندسة',
    askBudget27: 3560000, sourceBudget2026: 2700000, amount2027: 3120000, notes: 'مخطط التنفيذ على مرحلتين.',
    contractNo: 'EN-25201', ecaCategory: 'CAPEX', status: 'معتمد',
    financialHistory: [{ year: 2024, amount: 790000, note: 'دراسة السعة' }, { year: 2025, amount: 1850000, note: 'تصميم أولي' }, { year: 2026, amount: 2700000, note: 'المصدر المعتمد' }, { year: 2027, amount: 3120000, note: 'تقدير السنة القادمة' }],
  },
  {
    id: 'project-007', no: '007', outage: 'Not outage', workDescription: 'تأهيل شبكة تصريف الأمطار', department: 'المرافق',
    askBudget27: 980000, sourceBudget2026: 620000, amount2027: 760000, notes: 'يُنفذ قبل موسم الأمطار.',
    contractNo: 'FM-25330', ecaCategory: 'OPEX', status: 'قيد المراجعة',
    financialHistory: [{ year: 2024, amount: 190000, note: 'مسح ميداني' }, { year: 2025, amount: 420000, note: 'تنظيف القنوات' }, { year: 2026, amount: 620000, note: 'المصدر المعتمد' }, { year: 2027, amount: 760000, note: 'تقدير السنة القادمة' }],
  },
]

const emptyForm: ProjectForm = {
  no: '', outage: 'Not outage', workDescription: '', department: departments[0], askBudget27: '',
  sourceBudget2026: '', amount2027: '', notes: '', contractNo: '', ecaCategory: categories[0], status: 'قيد المراجعة',
}

const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)
const formatOptionalAmount = (amount: number | null | undefined) => typeof amount === 'number' && Number.isFinite(amount)
  ? formatAmount(amount)
  : 'غير متاح'
const formatSignedAmount = (amount: number | null) => amount === null
  ? 'غير متاح'
  : `${amount > 0 ? '+' : amount < 0 ? '−' : ''}${formatAmount(Math.abs(amount))}`
const formatPercentage = (amount: number | null) => amount === null
  ? 'غير متاح'
  : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(amount)}%`
function App() {
  const [projects, setProjects] = useState(initialProjects)
  const [view, setView] = useState<View>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProjectForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [outageFilter, setOutageFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortMode, setSortMode] = useState('deficit')

  const selectedProject = projects.find((project) => project.id === selectedId)
  const selectedAnalysis = selectedProject ? analyzeProject(selectedProject) : null
  const filteredProjects = useMemo(() => projects.filter((project) => {
    const search = projectSearch.trim().toLocaleLowerCase('ar')
    const matchesSearch = `${project.workDescription} ${project.contractNo}`.toLocaleLowerCase('ar').includes(search)
    return matchesSearch && (!departmentFilter || project.department === departmentFilter)
      && (!statusFilter || project.status === statusFilter) && (!outageFilter || project.outage === outageFilter)
      && (!categoryFilter || project.ecaCategory === categoryFilter)
  }), [projects, projectSearch, departmentFilter, statusFilter, outageFilter, categoryFilter])

  const sortedProjects = useMemo(() => [...filteredProjects].sort((left, right) => {
    const leftAnalysis = analyzeProject(left)
    const rightAnalysis = analyzeProject(right)
    if (sortMode === 'coverage') return (leftAnalysis.coveragePercent ?? Infinity) - (rightAnalysis.coveragePercent ?? Infinity)
    if (sortMode === 'change-desc') return (rightAnalysis.annualChange ?? -Infinity) - (leftAnalysis.annualChange ?? -Infinity)
    if (sortMode === 'change-asc') return (leftAnalysis.annualChange ?? Infinity) - (rightAnalysis.annualChange ?? Infinity)
    return (leftAnalysis.budgetGap ?? Infinity) - (rightAnalysis.budgetGap ?? Infinity)
  }), [filteredProjects, sortMode])

  useEffect(() => {
    if (!formOpen && !selectedId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFormOpen(false)
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formOpen, selectedId])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const totals = summarizeProjects(filteredProjects)
  const departmentTotals = departments.map((department) => ({
    department,
    amount: sumFiniteAmounts(filteredProjects.filter((project) => project.department === department).map((project) => project.amount2027)),
    count: filteredProjects.filter((project) => project.department === department).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.amount - a.amount)
  const maxDepartmentAmount = Math.max(...departmentTotals.map((item) => item.amount), 1)
  const outageTotals = (['Outage', 'Not outage'] as const).map((outage) => ({
    outage,
    amount: sumFiniteAmounts(filteredProjects.filter((project) => project.outage === outage).map((project) => project.amount2027)),
    count: filteredProjects.filter((project) => project.outage === outage).length,
  }))
  const maxOutageAmount = Math.max(...outageTotals.map((item) => item.amount), 1)
  const statusTotals = statusOptions.map((status) => ({ status, count: filteredProjects.filter((project) => project.status === status).length }))
  const largestDeficits = filteredProjects.map((project) => ({ project, analysis: analyzeProject(project) }))
    .filter((item) => item.analysis.budgetGap !== null && item.analysis.budgetGap < 0)
    .sort((left, right) => (left.analysis.budgetGap ?? 0) - (right.analysis.budgetGap ?? 0)).slice(0, 5)
  const annualIncreases = filteredProjects.map((project) => ({ project, analysis: analyzeProject(project) }))
    .filter((item) => item.analysis.annualChange !== null && item.analysis.annualChange > 0)
    .sort((left, right) => (right.analysis.annualChange ?? 0) - (left.analysis.annualChange ?? 0)).slice(0, 5)
  const annualDecreases = filteredProjects.map((project) => ({ project, analysis: analyzeProject(project) }))
    .filter((item) => item.analysis.annualChange !== null && item.analysis.annualChange < 0)
    .sort((left, right) => (left.analysis.annualChange ?? 0) - (right.analysis.annualChange ?? 0)).slice(0, 5)
  const maxDeficit = Math.max(...largestDeficits.map((item) => Math.abs(item.analysis.budgetGap ?? 0)), 1)
  const qualityReport = inspectDataQuality(filteredProjects)
  const activeFilters = Boolean(projectSearch || departmentFilter || statusFilter || outageFilter || categoryFilter)
  const projectFilterBar = <ProjectFilterBar
    searchValue={projectSearch}
    departmentValue={departmentFilter}
    statusValue={statusFilter}
    outageValue={outageFilter}
    categoryValue={categoryFilter}
    active={activeFilters}
    onSearchChange={setProjectSearch}
    onDepartmentChange={setDepartmentFilter}
    onStatusChange={setStatusFilter}
    onOutageChange={setOutageFilter}
    onCategoryChange={setCategoryFilter}
    onClear={clearFilters}
  />

  function openNewForm() {
    setEditingId(null)
    setForm({ ...emptyForm, no: String(Math.max(...projects.map((project) => Number(project.no) || 0), 0) + 1).padStart(3, '0') })
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(project: Project) {
    setSelectedId(null)
    setEditingId(project.id)
    setForm({
      no: project.no, outage: project.outage, workDescription: project.workDescription, department: project.department,
      askBudget27: String(project.askBudget27 ?? ''), sourceBudget2026: String(project.sourceBudget2026 ?? ''), amount2027: String(project.amount2027 ?? ''),
      notes: project.notes, contractNo: project.contractNo, ecaCategory: project.ecaCategory, status: project.status,
    })
    setFormError('')
    setFormOpen(true)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ask = Number(form.askBudget27)
    const source2026 = Number(form.sourceBudget2026)
    const amount2027 = Number(form.amount2027)
    if (!form.no.trim() || !form.workDescription.trim() || !form.department || !form.contractNo.trim()) {
      setFormError('أكمل الحقول المطلوبة قبل الحفظ.')
      return
    }
    if ([form.askBudget27, form.sourceBudget2026, form.amount2027].some((amount) => amount.trim() === '')) {
      setFormError('أدخل المبالغ المطلوبة للسنوات 2026 و2027 والميزانية المطلوبة.')
      return
    }
    if (![ask, source2026, amount2027].every((amount) => Number.isFinite(amount) && amount >= 0)) {
      setFormError('أدخل مبالغ رقمية صحيحة، ولا تستخدم قيمة سالبة.')
      return
    }

    const previous = projects.find((project) => project.id === editingId)
    const financialHistory = (previous?.financialHistory ?? []).filter((record) => record.year !== 2026 && record.year !== 2027)
    financialHistory.push(
      { year: 2026, amount: source2026, note: 'المبلغ المصدر لعام 2026' },
      { year: 2027, amount: amount2027, note: 'المبلغ المدرج لعام 2027' },
    )
    const savedProject: Project = {
      id: editingId ?? `project-${crypto.randomUUID()}`,
      no: form.no.trim(), outage: form.outage, workDescription: form.workDescription.trim(), department: form.department,
      askBudget27: ask, sourceBudget2026: source2026, amount2027, notes: form.notes.trim(), contractNo: form.contractNo.trim(),
      ecaCategory: form.ecaCategory, status: form.status, financialHistory: financialHistory.sort((a, b) => a.year - b.year),
    }
    setProjects((current) => previous
      ? current.map((project) => project.id === editingId ? savedProject : project)
      : [savedProject, ...current])
    setFormOpen(false)
    setToast(previous ? 'تم تحديث بيانات المشروع محليًا.' : 'تمت إضافة المشروع محليًا.')
  }

  function clearFilters() {
    setProjectSearch('')
    setDepartmentFilter('')
    setStatusFilter('')
    setOutageFilter('')
    setCategoryFilter('')
  }

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar" aria-label="التنقل الرئيسي">
        <a className="brand" href="#الرئيسية" onClick={(event) => { event.preventDefault(); setView('overview') }}>
          <span className="brand-mark" aria-hidden="true">م</span>
          <span><strong>مِيزان</strong><small>إدارة ميزانيات المشاريع</small></span>
        </a>
        <div className="sidebar-label">مساحة العمل</div>
        <nav className="nav-list" aria-label="الصفحات">
          <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')} aria-current={view === 'overview' ? 'page' : undefined}>
            <span className="nav-symbol" aria-hidden="true">◫</span> نظرة عامة
          </button>
          <button className={`nav-item ${view === 'projects' ? 'active' : ''}`} onClick={() => setView('projects')} aria-current={view === 'projects' ? 'page' : undefined}>
            <span className="nav-symbol" aria-hidden="true">▤</span> المشاريع <span className="nav-count">{projects.length}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-dot" aria-hidden="true" />
          <span><strong>بيئة تجريبية</strong><small>البيانات محلية وغير متصلة</small></span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>الميزانيات</span><span className="breadcrumb-separator">/</span><strong>{view === 'overview' ? 'نظرة عامة' : 'قائمة المشاريع'}</strong></div>
          <div className="topbar-actions">
            <span className="year-pill"><span className="year-dot" /> دورة الميزانية <strong>2027</strong></span>
            <button className="avatar" type="button" aria-label="ملف المستخدم التجريبي">م</button>
          </div>
        </header>

        <div className="page-content">
          {view === 'overview' ? (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">السبت، ٣ أكتوبر ٢٠٢٦ <span className="eyebrow-line" /></div>
                  <h1>نظرة عامة</h1>
                  <p>صورة موجزة عن طلبات الميزانية والمبالغ المدرجة للمشاريع.</p>
                </div>
                <button className="button button-primary" type="button" onClick={openNewForm}><span className="button-plus" aria-hidden="true">+</span> إضافة مشروع</button>
              </section>

              <div className="demo-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><span><strong>بيانات تجريبية</strong> الأرقام والمشاريع المعروضة لأغراض النموذج الأولي فقط.</span><span className="demo-banner-tag">محلي</span></div>

              <section className="panel dashboard-filters">
                <div className="filter-heading"><div><span className="section-kicker">نطاق التحليل</span><h2>تصفية المشاريع</h2></div><span className="filter-result-count">{filteredProjects.length} من {projects.length} مشروع</span></div>
                {projectFilterBar}
              </section>

              <section className="metric-grid" aria-label="مؤشرات ميزانية 2027">
                <article className="metric-card metric-primary">
                  <div className="metric-top"><span>إجمالي Ask Budget 27</span><span className="metric-icon">01</span></div>
                  <div className="metric-value">{formatAmount(totals.askBudget27)}<small>إجمالي المبالغ المطلوبة</small></div>
                  <div className="metric-foot"><span className="metric-foot-mark">↗</span> عبر {totals.projectCount} مشاريع مطابقة</div>
                </article>
                <article className="metric-card">
                  <div className="metric-top"><span>إجمالي المبلغ لعام 2027</span><span className="metric-icon icon-green">02</span></div>
                  <div className="metric-value">{formatAmount(totals.amount2027)}<small>المبلغ المسجل لعام 2027</small></div>
                  <div className="metric-foot"><span className="metric-foot-mark green-mark">●</span> تغطية إجمالية {formatPercentage(totals.coveragePercent)}</div>
                </article>
                <article className="metric-card">
                  <div className="metric-top"><span>صافي فجوة ميزانية 2027</span><span className="metric-icon icon-amber">03</span></div>
                  <div className={`metric-value ${totals.budgetGap < 0 ? 'delta-negative' : 'delta-positive'}`}>{formatSignedAmount(totals.budgetGap)}<small>المبلغ لعام 2027 − Ask Budget 27</small></div>
                  <div className="metric-foot"><span className="metric-foot-mark amber-mark">↕</span> {totals.budgetGap < 0 ? 'عجز عن المطلوب' : totals.budgetGap > 0 ? 'فائض عن المطلوب' : 'مطابق للمطلوب'}</div>
                </article>
                <article className="metric-card">
                  <div className="metric-top"><span>المشاريع المسجلة</span><span className="metric-icon icon-coral">04</span></div>
                  <div className="metric-value">{String(totals.projectCount).padStart(2, '0')}<small>مشروع ضمن الفلاتر</small></div>
                  <div className="metric-foot"><span className="metric-foot-mark coral-mark">⌁</span> من أصل {projects.length} مشاريع</div>
                </article>
                <article className="metric-card metric-deficit-card">
                  <div className="metric-top"><span>مشاريع لديها عجز</span><span className="metric-icon icon-coral">05</span></div>
                  <div className="metric-value">{String(totals.deficitCount).padStart(2, '0')}<small>المبلغ لعام 2027 أقل من الطلب</small></div>
                  <div className="metric-foot"><span className="metric-foot-mark coral-mark">!</span> من {totals.projectCount} مشاريع مطابقة</div>
                </article>
              </section>

              <section className="analytics-grid" aria-label="تحليلات توزيع الميزانية">
                <article className="panel department-panel">
                  <div className="panel-heading"><div><span className="section-kicker">توزيع المبلغ لعام 2027</span><h2>حسب القسم / الدائرة</h2></div><span className="panel-period">2027</span></div>
                  <div className="department-list">
                    {departmentTotals.map((item, index) => (
                      <div className="department-row" key={item.department}>
                        <div className="department-meta"><strong>{item.department} <small>{item.count} مشاريع</small></strong><span>{formatAmount(item.amount)}</span></div>
                        <div className="bar-track" role="img" aria-label={`${item.department}: ${formatAmount(item.amount)}`}><span className={`bar-fill bar-${index % 4}`} style={{ width: `${(item.amount / maxDepartmentAmount) * 100}%` }} /></div>
                      </div>
                    ))}
                    {filteredProjects.length === 0 && <div className="chart-empty">لا توجد مشاريع مطابقة للفلاتر.</div>}
                  </div>
                  <div className="panel-footnote"><span className="legend-dot" /> مبلغ 2027 المسجل، وليس المصروف</div>
                </article>
                <article className="panel outage-panel">
                  <div className="panel-heading"><div><span className="section-kicker">توزيع المبلغ لعام 2027</span><h2>Outage / Not outage</h2></div><span className="panel-period">حسب النوع</span></div>
                  <div className="outage-list">
                    {outageTotals.map((item, index) => <div className="outage-row" key={item.outage}>
                      <div className="outage-meta"><span className={`outage-badge ${item.outage === 'Outage' ? 'outage-yes' : 'outage-no'}`}>{item.outage}</span><span>{item.count} مشاريع</span><strong>{formatAmount(item.amount)}</strong></div>
                      <div className="bar-track"><span className={`bar-fill outage-fill-${index}`} style={{ width: `${(item.amount / maxOutageAmount) * 100}%` }} /></div>
                    </div>)}
                    {filteredProjects.length === 0 && <div className="chart-empty">لا توجد مشاريع مطابقة للفلاتر.</div>}
                  </div>
                  <div className="panel-footnote">المبلغ حسب تصنيف التوقف</div>
                </article>
                <article className="panel status-panel">
                  <div className="panel-heading"><div><span className="section-kicker">توزيع عدد المشاريع</span><h2>حسب الحالة</h2></div><button className="text-button" type="button" onClick={() => setView('projects')}>عرض القائمة <span aria-hidden="true">←</span></button></div>
                  <div className="status-list">
                    {statusTotals.map(({ status, count }) => <div className="status-row" key={status}><span className={`status-dot status-${statusOptions.indexOf(status)}`} /><span>{status}</span><strong>{String(count).padStart(2, '0')}</strong><div className="status-mini-track"><span style={{ width: `${totals.projectCount ? (count / totals.projectCount) * 100 : 0}%` }} /></div></div>)}
                  </div>
                  <div className="status-summary"><span>إجمالي المشاريع المطابقة</span><strong>{String(totals.projectCount).padStart(2, '0')}</strong></div>
                </article>
              </section>

              <section className="analysis-secondary-grid">
                <article className="panel insight-panel">
                  <div className="panel-heading"><div><span className="section-kicker">المبلغ لعام 2027 أقل من الطلب</span><h2>أكبر المشاريع عجزًا</h2></div><span className="panel-period">أعلى 5</span></div>
                  <div className="ranked-list">
                    {largestDeficits.map(({ project, analysis }, index) => <div className="ranked-row" key={project.id}>
                      <span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="rank-description"><strong>{project.workDescription}</strong><small>{project.department} · {project.contractNo}</small></span><span className="rank-amount delta-negative">{formatSignedAmount(analysis.budgetGap)}</span>
                      <div className="bar-track rank-track"><span className="bar-fill deficit-fill" style={{ width: `${(Math.abs(analysis.budgetGap ?? 0) / maxDeficit) * 100}%` }} /></div>
                    </div>)}
                    {largestDeficits.length === 0 && <div className="chart-empty">لا يوجد عجز ضمن المشاريع المطابقة.</div>}
                  </div>
                </article>
                <article className="panel insight-panel annual-change-panel">
                  <div className="panel-heading"><div><span className="section-kicker">مقارنة مع المصدر 2026</span><h2>أكبر التغيرات السنوية</h2></div><span className="panel-period">مبلغ 2027 − 2026</span></div>
                  <div className="change-columns">
                    <div className="change-column"><h3>أكبر الزيادات</h3>{annualIncreases.map(({ project, analysis }) => <div className="change-row" key={project.id}><span>{project.workDescription}</span><strong className="delta-positive">{formatSignedAmount(analysis.annualChange)}</strong></div>)}{annualIncreases.length === 0 && <div className="chart-empty">لا توجد زيادات ضمن النتائج.</div>}</div>
                    <div className="change-column"><h3>أكبر الانخفاضات</h3>{annualDecreases.map(({ project, analysis }) => <div className="change-row" key={project.id}><span>{project.workDescription}</span><strong className="delta-negative">{formatSignedAmount(analysis.annualChange)}</strong></div>)}{annualDecreases.length === 0 && <div className="chart-empty">لا توجد انخفاضات ضمن النتائج.</div>}</div>
                  </div>
                </article>
              </section>

              <section className="panel quality-panel">
                <div className="panel-heading"><div><span className="section-kicker">فحوص المصدر الحالي</span><h2>جودة البيانات</h2></div><span className={`quality-summary ${qualityReport.missing.length + qualityReport.negative.length + qualityReport.duplicateContracts.length > 0 ? 'quality-summary-warning' : ''}`}>{qualityReport.missing.length + qualityReport.negative.length + qualityReport.duplicateContracts.length} تنبيهات</span></div>
                <div className="quality-grid">
                  <div className="quality-item"><span className="quality-mark">{qualityReport.missing.length ? '!' : '✓'}</span><span>وصف أو مبلغ أساسي مفقود</span><strong>{qualityReport.missing.length}</strong></div>
                  <div className="quality-item"><span className="quality-mark">{qualityReport.negative.length ? '!' : '✓'}</span><span>مبالغ سالبة</span><strong>{qualityReport.negative.length}</strong></div>
                  <div className="quality-item"><span className="quality-mark">{qualityReport.duplicateContracts.length ? '!' : '✓'}</span><span>مجموعات أرقام عقود مكررة</span><strong>{qualityReport.duplicateContracts.length}</strong></div>
                </div>
                {(qualityReport.missing.length > 0 || qualityReport.negative.length > 0 || qualityReport.duplicateContracts.length > 0) && <div className="quality-details" role="status">
                  {qualityReport.missing.map((project) => {
                    const missingFields = [
                      !project.workDescription?.trim() ? 'وصف العمل' : null,
                      !Number.isFinite(project.askBudget27) ? 'Ask Budget 27' : null,
                      !Number.isFinite(project.sourceBudget2026) ? 'مصدر 2026' : null,
                      !Number.isFinite(project.amount2027) ? 'مبلغ 2027' : null,
                    ].filter((field): field is string => field !== null)
                    return <p key={`missing-${project.id}`}>المشروع {project.no || project.id}: مفقود {missingFields.join('، ')}.</p>
                  })}
                  {qualityReport.negative.map((project) => <p key={`negative-${project.id}`}>المشروع {project.no || project.id}: يحتوي على مبلغ سالب.</p>)}
                  {qualityReport.duplicateContracts.map((duplicate) => <p key={`contract-${duplicate.contractNo}`}>رقم العقد {duplicate.contractNo} مكرر في المشاريع {duplicate.projectNumbers.join('، ')}.</p>)}
                </div>}
                <div className="quality-note">الفرق المحفوظ بين 2026 و2027 غير متاح للمقارنة؛ نموذج البيانات الحالي لا يتضمن حقلًا محفوظًا لهذا الفرق. لا تُعدّل التنبيهات البيانات تلقائيًا.</div>
              </section>

              <section className="panel analytics-table-panel">
                <div className="analytics-table-heading"><div><span className="section-kicker">تحليل على مستوى المشروع</span><h2>جدول فجوة الميزانية والتغير السنوي</h2><p>فجوة 2027 = مبلغ 2027 − Ask Budget 27. الفرق السنوي = مبلغ 2027 − مصدر 2026.</p></div><label className="sort-control"><span>ترتيب حسب</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="deficit">أكبر عجز</option><option value="coverage">أقل نسبة تغطية</option><option value="change-desc">أكبر زيادة سنوية</option><option value="change-asc">أكبر انخفاض سنوي</option></select></label></div>
                <div className="table-scroll analytical-table-scroll" tabIndex={0} aria-label="جدول التحليلات، مرر أفقيًا لعرض الأعمدة">
                  <table className="analytics-table"><thead><tr><th>المشروع</th><th>Ask Budget 27</th><th>المبلغ لعام 2027</th><th>فجوة ميزانية 2027</th><th>نسبة تغطية الطلب</th><th>التغير عن 2026</th></tr></thead><tbody>
                    {sortedProjects.map((project) => { const analysis = analyzeProject(project); return <tr key={project.id}><td><button className="project-name-button" type="button" onClick={() => setSelectedId(project.id)}>{project.workDescription}</button><small>{project.department}</small></td><td className="amount-cell">{formatOptionalAmount(project.askBudget27)}</td><td className="amount-cell amount-strong">{formatOptionalAmount(project.amount2027)}</td><td className={`amount-cell ${analysis.budgetGap === null ? '' : analysis.budgetGap < 0 ? 'delta-negative' : 'delta-positive'}`} title="المبلغ لعام 2027 ناقص Ask Budget 27">{formatSignedAmount(analysis.budgetGap)}</td><td className="amount-cell">{formatPercentage(analysis.coveragePercent)}</td><td className={`amount-cell ${analysis.annualChange === null ? '' : analysis.annualChange < 0 ? 'delta-negative' : 'delta-positive'}`} title="المبلغ لعام 2027 ناقص المبلغ المصدر لعام 2026">{formatSignedAmount(analysis.annualChange)}</td></tr>})}
                  </tbody></table>
                  {sortedProjects.length === 0 && <div className="empty-state table-empty"><span className="empty-symbol">⌕</span><strong>{projects.length ? 'لا توجد نتائج مطابقة' : 'لا توجد بيانات مشاريع'}</strong><p>{projects.length ? 'غيّر الفلاتر أو امسحها لعرض النتائج.' : 'لا توجد سجلات متاحة للتحليل.'}</p>{activeFilters && <button className="button button-secondary" type="button" onClick={clearFilters}>مسح الفلاتر</button>}</div>}
                </div>
                <div className="table-foot"><span>عرض {sortedProjects.length} من {projects.length} مشاريع</span><span>العملة غير محددة في مصدر البيانات</span></div>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading"><div><span className="section-kicker">آخر ما تم تسجيله</span><h2>مشاريع تحتاج المتابعة</h2></div><button className="text-button" type="button" onClick={() => setView('projects')}>كل المشاريع <span aria-hidden="true">←</span></button></div>
                <div className="recent-list">
                  {filteredProjects.filter((project) => project.status === 'مطلوب تحديث' || project.status === 'قيد المراجعة').slice(0, 4).map((project) => (
                    <button className="recent-row" type="button" key={project.id} onClick={() => setSelectedId(project.id)}>
                      <span className="recent-number">{project.no}</span><span className="recent-description"><strong>{project.workDescription}</strong><small>{project.department} <i>·</i> {project.contractNo}</small></span><span className="recent-amount">{formatOptionalAmount(project.amount2027)}<small>مبلغ 2027</small></span><span className={`status-badge ${project.status === 'مطلوب تحديث' ? 'status-badge-warn' : 'status-badge-review'}`}>{project.status}</span><span className="row-arrow" aria-hidden="true">←</span>
                    </button>
                  ))}
                  {filteredProjects.length === 0 && <div className="empty-state compact-empty"><span className="empty-symbol">∅</span><strong>{projects.length ? 'لا توجد مشاريع مطابقة' : 'لا توجد مشاريع بعد'}</strong><p>{projects.length ? 'جرّب تعديل الفلاتر أو مسحها.' : 'أضف أول مشروع لبدء متابعة الميزانية.'}</p>{projects.length ? <button className="button button-secondary" onClick={clearFilters}>مسح الفلاتر</button> : <button className="button button-secondary" onClick={openNewForm}>إضافة مشروع</button>}</div>}
                </div>
              </section>
              <footer className="page-footer"><span>مِيزان <i>·</i> بيانات تجريبية</span><span>العملة غير محددة في مصدر البيانات</span></footer>
            </>
          ) : (
            <>
              <section className="page-heading projects-heading">
                <div><div className="eyebrow">إدارة البيانات <span className="eyebrow-line" /></div><h1>قائمة المشاريع</h1><p>ابحث عن المشاريع وصفّها حسب القسم أو الحالة أو نوع التوقف.</p></div>
                <button className="button button-primary" type="button" onClick={openNewForm}><span className="button-plus" aria-hidden="true">+</span> إضافة مشروع</button>
              </section>
              <div className="demo-banner compact-banner" role="note"><span className="demo-banner-icon" aria-hidden="true">i</span><span><strong>بيانات تجريبية</strong> التعديلات في هذه الجلسة محلية فقط ولا تُحفظ في SharePoint.</span><span className="demo-banner-tag">محلي</span></div>
              <section className="panel projects-panel">
                <div className="projects-toolbar">
                  <div><span className="section-kicker">سجل المشاريع</span><h2>كل المشاريع <span className="result-count">{filteredProjects.length}</span></h2></div>
                  {projectFilterBar}
                </div>
                <div className="table-scroll" tabIndex={0} aria-label="جدول المشاريع، مرر أفقيًا لعرض بقية الأعمدة">
                  <table className="projects-table">
                    <thead><tr><th>no</th><th>Outage / Not outage</th><th>وصف العمل</th><th>القسم / الدائرة</th><th>Ask Budget 27</th><th>المصدر 2026</th><th>المبلغ 2027</th><th>الفرق 2026–2027</th><th>الملاحظات</th><th>رقم العقد</th><th>ECA Category</th><th>الحالة</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
                    <tbody>
                      {filteredProjects.map((project) => {
                        const analysis = analyzeProject(project)
                        const delta = analysis.annualChange
                        return <tr key={project.id}>
                          <td className="number-cell">{project.no}</td><td><span className={`outage-badge ${project.outage === 'Outage' ? 'outage-yes' : 'outage-no'}`}>{project.outage}</span></td>
                          <td><button className="project-name-button" type="button" onClick={() => setSelectedId(project.id)}>{project.workDescription}</button></td><td>{project.department}</td>
                          <td className="amount-cell">{formatOptionalAmount(project.askBudget27)}</td><td className="amount-cell">{formatOptionalAmount(project.sourceBudget2026)}</td><td className="amount-cell amount-strong">{formatOptionalAmount(project.amount2027)}</td>
                          <td className={`amount-cell ${delta === null ? '' : delta >= 0 ? 'delta-positive' : 'delta-negative'}`}>{formatSignedAmount(delta)}</td>
                          <td className="notes-cell" title={project.notes}>{project.notes || '—'}</td><td className="contract-cell">{project.contractNo}</td><td><span className="category-tag">{project.ecaCategory}</span></td><td><span className={`status-badge ${project.status === 'معتمد' ? 'status-badge-approved' : project.status === 'مطلوب تحديث' ? 'status-badge-warn' : project.status === 'مؤجل' ? 'status-badge-paused' : 'status-badge-review'}`}>{project.status}</span></td>
                          <td><button className="row-menu-button" type="button" onClick={() => setSelectedId(project.id)} aria-label={`عرض تفاصيل ${project.workDescription}`}>•••</button></td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                  {filteredProjects.length === 0 && <div className="empty-state table-empty"><span className="empty-symbol">⌕</span><strong>{projects.length ? 'لا توجد نتائج مطابقة' : 'لا توجد مشاريع مسجلة'}</strong><p>{projects.length ? 'جرّب تعديل كلمات البحث أو مسح عوامل التصفية.' : 'أضف مشروعًا لعرضه في هذه القائمة.'}</p>{projects.length ? <button className="button button-secondary" type="button" onClick={clearFilters}>مسح التصفية</button> : <button className="button button-primary" type="button" onClick={openNewForm}>إضافة مشروع</button>}</div>}
                </div>
                <div className="table-foot"><span>عرض {filteredProjects.length} من {projects.length} مشاريع</span><span>التغير السنوي = مبلغ 2027 − المصدر 2026</span></div>
              </section>
              <footer className="page-footer"><span>مِيزان <i>·</i> نموذج أولي</span><span>بيانات محلية تجريبية</span></footer>
            </>
          )}
        </div>
      </main>

      {selectedProject && <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null) }}>
        <section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title" dir="rtl">
          <header className="drawer-header"><div><span className="section-kicker">تفاصيل المشروع <i>·</i> {selectedProject.no}</span><h2 id="detail-title">{selectedProject.workDescription}</h2></div><button className="icon-button close-button" type="button" onClick={() => setSelectedId(null)} aria-label="إغلاق التفاصيل">×</button></header>
          <div className="drawer-content">
            <div className="detail-status-line"><span className={`status-badge ${selectedProject.status === 'معتمد' ? 'status-badge-approved' : selectedProject.status === 'مطلوب تحديث' ? 'status-badge-warn' : selectedProject.status === 'مؤجل' ? 'status-badge-paused' : 'status-badge-review'}`}>{selectedProject.status}</span><span className={`outage-badge ${selectedProject.outage === 'Outage' ? 'outage-yes' : 'outage-no'}`}>{selectedProject.outage}</span><span>{selectedProject.department}</span><span className="contract-cell">{selectedProject.contractNo}</span></div>
            <div className="detail-metrics"><div><span>Ask Budget 27</span><strong>{formatOptionalAmount(selectedProject.askBudget27)}</strong></div><div><span>المبلغ لعام 2027</span><strong>{formatOptionalAmount(selectedProject.amount2027)}</strong></div><div><span>فجوة ميزانية 2027</span><strong className={(selectedAnalysis?.budgetGap ?? 0) < 0 ? 'delta-negative' : 'delta-positive'}>{formatSignedAmount(selectedAnalysis?.budgetGap ?? null)}</strong></div></div>
            <section className="history-section"><div className="drawer-section-heading"><div><span className="section-kicker">من بداية المشروع</span><h3>المسار المالي السنوي</h3></div><span className="panel-period">{selectedProject.financialHistory[0]?.year ?? 2026}–2027</span></div>
              <div className="history-chart" aria-label="مخطط المبالغ حسب السنة">{selectedProject.financialHistory.map((record) => { const maxAmount = Math.max(...selectedProject.financialHistory.map((entry) => entry.amount), 1); return <div className="history-column" key={record.year}><span className="history-amount">{formatAmount(record.amount)}</span><div className="history-bar-space"><span className={`history-bar ${record.year === 2027 ? 'history-bar-current' : ''}`} style={{ height: `${Math.max((record.amount / maxAmount) * 100, 6)}%` }} /></div><strong>{record.year}</strong></div>})}</div>
              <div className="history-list">{selectedProject.financialHistory.map((record) => <div className="history-entry" key={record.year}><span className="history-year">{record.year}</span><span>{record.note}</span><strong>{formatAmount(record.amount)}</strong></div>)}</div>
            </section>
            <section className="detail-data-section"><div className="drawer-section-heading"><div><span className="section-kicker">بيانات السجل</span><h3>معلومات المشروع</h3></div></div><div className="detail-data-grid"><div><span>القسم / الدائرة</span><strong>{selectedProject.department}</strong></div><div><span>ECA Category</span><strong>{selectedProject.ecaCategory}</strong></div><div><span>المبلغ المصدر لعام 2026</span><strong>{formatOptionalAmount(selectedProject.sourceBudget2026)}</strong></div><div><span>التغير 2026–2027</span><strong className={(selectedAnalysis?.annualChange ?? 0) < 0 ? 'delta-negative' : 'delta-positive'}>{formatSignedAmount(selectedAnalysis?.annualChange ?? null)}</strong></div><div className="detail-note"><span>الملاحظات</span><strong>{selectedProject.notes || 'لا توجد ملاحظات'}</strong></div></div></section>
          </div>
          <footer className="drawer-footer"><span className="local-note"><span className="demo-dot" /> بيانات تجريبية محلية</span><button className="button button-secondary" type="button" onClick={() => openEditForm(selectedProject)}>تعديل البيانات</button></footer>
        </section>
      </div>}

      {formOpen && <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
        <section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="form-title" dir="rtl">
          <header className="dialog-header"><div><span className="section-kicker">إدارة سجل المشروع</span><h2 id="form-title">{editingId ? 'تعديل بيانات المشروع' : 'إضافة مشروع جديد'}</h2><p>أدخل البيانات المالية والتشغيلية للمشروع.</p></div><button className="icon-button close-button" type="button" onClick={() => setFormOpen(false)} aria-label="إغلاق النموذج">×</button></header>
          <form onSubmit={handleSave} noValidate>
            <div className="form-body">
              <div className="form-section-title"><span>01</span><h3>بيانات المشروع</h3></div>
              <div className="form-grid">
                <label className="field"><span>no <b>*</b></span><input required value={form.no} onChange={(event) => setForm({ ...form, no: event.target.value })} placeholder="مثال: 008" /></label>
                <label className="field"><span>نوع التوقف <b>*</b></span><select value={form.outage} onChange={(event) => setForm({ ...form, outage: event.target.value as OutageType })}><option value="Outage">Outage</option><option value="Not outage">Not outage</option></select></label>
                <label className="field field-wide"><span>وصف العمل <b>*</b></span><input required value={form.workDescription} onChange={(event) => setForm({ ...form, workDescription: event.target.value })} placeholder="اكتب وصفًا مختصرًا للعمل" /></label>
                <label className="field"><span>القسم / الدائرة <b>*</b></span><select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>{departments.map((department) => <option key={department}>{department}</option>)}</select></label>
                <label className="field"><span>رقم العقد <b>*</b></span><input required value={form.contractNo} onChange={(event) => setForm({ ...form, contractNo: event.target.value })} placeholder="مثال: CT-26001" /></label>
                <label className="field"><span>ECA Category</span><select value={form.ecaCategory} onChange={(event) => setForm({ ...form, ecaCategory: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="field"><span>الحالة <b>*</b></span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
              </div>
              <div className="form-section-title financial-form-title"><span>02</span><h3>الميزانية المالية</h3></div>
              <div className="form-grid financial-form-grid">
                <label className="field"><span>Ask Budget 27 <b>*</b></span><div className="input-suffix"><input required type="number" min="0" step="1" value={form.askBudget27} onChange={(event) => setForm({ ...form, askBudget27: event.target.value })} placeholder="0" /><span>مبلغ</span></div></label>
                <label className="field"><span>المبلغ المصدر لعام 2026 <b>*</b></span><div className="input-suffix"><input required type="number" min="0" step="1" value={form.sourceBudget2026} onChange={(event) => setForm({ ...form, sourceBudget2026: event.target.value })} placeholder="0" /><span>مبلغ</span></div></label>
                <label className="field"><span>المبلغ لعام 2027 <b>*</b></span><div className="input-suffix"><input required type="number" min="0" step="1" value={form.amount2027} onChange={(event) => setForm({ ...form, amount2027: event.target.value })} placeholder="0" /><span>مبلغ</span></div></label>
                <div className="field"><span>الفرق 2026–2027 <b>تلقائي</b></span><div className="computed-value">{form.sourceBudget2026 !== '' && form.amount2027 !== '' && Number.isFinite(Number(form.sourceBudget2026)) && Number.isFinite(Number(form.amount2027)) ? `${Number(form.amount2027) - Number(form.sourceBudget2026) >= 0 ? '+' : '−'}${formatAmount(Math.abs(Number(form.amount2027) - Number(form.sourceBudget2026)))}` : '—'}<small>مبلغ 2027 − المصدر 2026</small></div></div>
                <label className="field field-wide"><span>الملاحظات</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="أضف ملاحظة مرتبطة بالمشروع" /></label>
              </div>
              {formError && <div className="form-error" role="alert"><span aria-hidden="true">!</span>{formError}</div>}
              <p className="form-local-note"><span className="demo-dot" /> هذا النموذج تجريبي؛ لا يتم حفظ البيانات خارج هذه الجلسة.</p>
            </div>
            <footer className="dialog-footer"><button className="button button-secondary" type="button" onClick={() => setFormOpen(false)}>إلغاء</button><button className="button button-primary" type="submit">{editingId ? 'حفظ التعديلات' : 'إضافة المشروع'}</button></footer>
          </form>
        </section>
      </div>}

      {toast && <div className="toast-message" role="status"><span aria-hidden="true">✓</span>{toast}<button type="button" onClick={() => setToast('')} aria-label="إغلاق التنبيه">×</button></div>}
    </div>
  )
}

export default App
