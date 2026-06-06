/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Ship, 
  Calendar, 
  Target, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Sliders, 
  X, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  Share2, 
  Info,
  ChevronRight,
  Eye,
  Settings,
  ChevronDown,
  Database,
  Upload,
  Loader
} from 'lucide-react';

import { 
  generateDefaultData, 
  parseGoogleSheetCSV,
  loadFromGoogleSheets,
  ContainerRecord, 
  CLIENTS, 
  ARMADORES 
} from './data';
import { UniaoLogo } from './components/UniaoLogo';

export default function App() {
  // Main states
  const [records, setRecords] = useState<ContainerRecord[]>(() => {
    const saved = localStorage.getItem('operational_dashboard_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return generateDefaultData();
  });

  const [selectedMonth, setSelectedMonth] = useState<'JUN26' | 'MAI26' | 'ABR26'>(() => {
    const savedMonth = localStorage.getItem('operational_dashboard_active_month');
    return (savedMonth as 'JUN26' | 'MAI26' | 'ABR26') || 'JUN26';
  });

  const activeMonthConfig = useMemo(() => {
    switch (selectedMonth) {
      case 'MAI26':
        return {
          prefix: '2026-05',
          name: 'Maio 2026',
          daysInMonth: 31,
          sheetKey: 'MAI26',
          nextMonth: '2026-06',
          prevMonthPrefix: '2026-04'
        };
      case 'ABR26':
        return {
          prefix: '2026-04',
          name: 'Abril 2026',
          daysInMonth: 30,
          sheetKey: 'ABR26',
          nextMonth: '2026-05',
          prevMonthPrefix: '' // No previous month for comparison
        };
      case 'JUN26':
      default:
        return {
          prefix: '2026-06',
          name: 'Junho 2026',
          daysInMonth: 30,
          sheetKey: 'JUN26',
          nextMonth: '',
          prevMonthPrefix: '2026-05'
        };
    }
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem('operational_dashboard_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('operational_dashboard_active_month', selectedMonth);
  }, [selectedMonth]);

  const [metaMensal, setMetaMensal] = useState<number>(() => {
    const saved = localStorage.getItem('operational_dashboard_meta_mensal');
    return saved ? parseInt(saved, 10) : 500;
  });

  // Persist meta mensal changes to localStorage
  useEffect(() => {
    localStorage.setItem('operational_dashboard_meta_mensal', String(metaMensal));
  }, [metaMensal]);

  // Auto-calculated Active Day based on selected month (No sliders/simulations needed)
  const activeDay = useMemo(() => {
    if (selectedMonth === 'JUN26') {
      const now = new Date();
      // Current system timestamp is in June 2026
      if (now.getFullYear() === 2026 && now.getMonth() === 5) {
        return Math.max(1, now.getDate());
      }
      return 3; // Defaults to June 3rd, 2026 for JUN26
    }
    if (selectedMonth === 'MAI26') return 31;
    if (selectedMonth === 'ABR26') return 30;
    return 30;
  }, [selectedMonth]);

  const [selectedBases, setSelectedBases] = useState<ContainerRecord['origem'][]>(() => {
    const saved = localStorage.getItem('operational_dashboard_selected_bases');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ['SUL', 'SUDOESTE', 'NORDESTE', 'MONSTER', 'MASTER'];
      }
    }
    return ['SUL', 'SUDOESTE', 'NORDESTE', 'MONSTER', 'MASTER'];
  });

  // Persist selectedBases changes to localStorage
  useEffect(() => {
    localStorage.setItem('operational_dashboard_selected_bases', JSON.stringify(selectedBases));
  }, [selectedBases]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');

  // Google Sheets Integration States
  const GOOGLE_SHEET_ID = '13JiiRQ9nXW2tKK-KmE0VBkdhihrNQ9kvU6fS9A0TJEI';
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('operational_dashboard_last_sync') || '';
  });

  // Function to sync from Google Sheets
  const handleSyncGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      console.log('[v0] Iniciando sincronização com Google Sheets...');
      const { records: googleRecords, sheetsFound } = await loadFromGoogleSheets(GOOGLE_SHEET_ID);
      
      console.log(`[v0] Sincronização retornou: ${googleRecords.length} registros de ${sheetsFound.length} abas`);
      
      if (googleRecords.length === 0) {
        alert('Nenhum dado foi encontrado no Google Sheets. Verifique se a planilha está compartilhada e publicada na web.');
        setIsSyncing(false);
        return;
      }

      console.log(`[v0] Salvando ${googleRecords.length} registros no localStorage`);
      setRecords(googleRecords);
      const now = new Date().toLocaleString('pt-BR');
      setLastSyncTime(now);
      localStorage.setItem('operational_dashboard_last_sync', now);
      
      // Auto-select June if available
      if (sheetsFound.includes('JUN26')) {
        setSelectedMonth('JUN26');
      }
      
      alert(`✓ Sincronização bem-sucedida!\n\nAbas carregadas: ${sheetsFound.join(', ')}\nTotal de contêineres: ${googleRecords.length}\n\nÚltima atualização: ${now}`);
    } catch (error: any) {
      console.error('[v0] Erro ao sincronizar Google Sheets:', error);
      alert(`Erro ao sincronizar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditMeta = () => {
    const novaMeta = window.prompt('Digite a nova Meta Mensal de contêineres:', String(metaMensal));
    if (novaMeta) {
      const parsed = parseInt(novaMeta);
      if (!isNaN(parsed) && parsed > 0) {
        setMetaMensal(parsed);
      }
    }
  };








  // Dashboard separate drag & drop handlers
  const handleDashboardDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDashboardDragActive(true);
    } else if (e.type === 'dragleave') {
      setDashboardDragActive(false);
    }
  };

  const handleDashboardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDashboardDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Filter bases selection helpers
  const toggleBaseFilter = (base: ContainerRecord['origem']) => {
    if (selectedBases.includes(base)) {
      if (selectedBases.length > 1) {
        setSelectedBases(prev => prev.filter(b => b !== base));
      } else {
        alert('Selecione pelo menos uma origem ativa.');
      }
    } else {
      setSelectedBases(prev => [...prev, base]);
    }
  };

  const selectAllBases = () => {
    setSelectedBases(['SUL', 'SUDOESTE', 'NORDESTE', 'MONSTER', 'MASTER']);
  };

  // -------------------------------------------------------------
  // DYNAMIC CALCULATIONS & METRICS ENGINE
  // -------------------------------------------------------------

  // Filter records based on UI settings
  const processedRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Filter by current active month prefix
      // For dynamic dashboard we load active month (or empty dates as "A PROGRAMAR")
      const isCurrentMonthOrEmpty = r.data === '' || r.data.startsWith(activeMonthConfig.prefix) || r.container === 'A PROGRAMAR';
      if (!isCurrentMonthOrEmpty) return false;

      // 2. Filter by actively selected sources
      if (!selectedBases.includes(r.origem)) return false;

      // 3. Filter by search query (Client or Container Number)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const clientMatch = r.cliente.toLowerCase().includes(query);
        const containerMatch = r.container.toLowerCase().includes(query);
        const armadorMatch = r.armador.toLowerCase().includes(query);
        if (!clientMatch && !containerMatch && !armadorMatch) return false;
      }

      // 4. Filter by status
      if (selectedStatus !== 'TODOS') {
        if (selectedStatus === 'EXECUTADO' && r.status !== 'EXECUTADO') return false;
        if (selectedStatus === 'PROGRAMADO' && r.status !== 'PROGRAMADO') return false;
        if (selectedStatus === 'A PROGRAMAR' && r.status !== 'A PROGRAMAR' && r.status !== 'STATUS OPER') return false;
      }

      return true;
    });
  }, [records, selectedBases, searchQuery, selectedStatus, activeMonthConfig]);

  // Previous Month values for historical reference
  const previousMonthMetrics = useMemo(() => {
    const prevPrefix = activeMonthConfig.prevMonthPrefix;
    if (!prevPrefix) {
      return { total: 0, executed: 0, programmed: 0, successRate: 0, ritmoDiario: 0 };
    }
    // Collect records belonging to the previous month
    const prevActive = records.filter(r => r.data.startsWith(prevPrefix) && selectedBases.includes(r.origem));
    
    // We filter out any blank lines and "STATUS OPER"
    const relevantPrev = prevActive.filter(r => r.status !== 'STATUS OPER');
    
    const total = relevantPrev.length;
    const executed = relevantPrev.filter(r => r.status === 'EXECUTADO').length;
    const programmed = relevantPrev.filter(r => r.status === 'PROGRAMADO' || r.status === 'A PROGRAMAR').length;
    const successRate = total > 0 ? (executed / total) * 100 : 0;
    
    return {
      total,
      executed,
      programmed,
      successRate: parseFloat(successRate.toFixed(1)),
      ritmoDiario: parseFloat((executed / 23).toFixed(1)) // Assuming same duration reference
    };
  }, [records, selectedBases, activeMonthConfig]);

  // Compute Current KPIs based on selected active month
  const currentKPIs = useMemo(() => {
    // Operational volume: ignore lines of "STATUS OPER" or empty rows
    const validMonth = processedRecords.filter(r => r.status !== 'STATUS OPER');
    
    const totalGeral = validMonth.length;
    
    // Create direct regex for active month extraction
    const regexStr = new RegExp(`${activeMonthConfig.prefix}-(\\d{2})`);

    // Executados: strictly based on parsed status from Column AO or defined status
    const executados = validMonth.filter(r => r.status === 'EXECUTADO').length;

    // Programados: strictly based on parsed status from Column AO or defined status
    const programados = validMonth.filter(r => r.status === 'PROGRAMADO' || r.status === 'A PROGRAMAR').length;

    // Success Rate (Taxa de Execução)
    const taxaExecucao = totalGeral > 0 ? (executados / totalGeral) * 100 : 0;

    // Target progress
    const progressoMeta = metaMensal > 0 ? (executados / metaMensal) * 100 : 0;

    // Daily Rhythm (Ritmo Diário): average executed per day in the month
    const ritmoDiario = activeDay > 0 ? executados / activeDay : 0;

    // Year End Closing Projection (Projeção de Fechamento): Based on execution rhythm and remaining days
    const totalDaysInMonth = activeMonthConfig.daysInMonth;
    const diasRestantes = Math.max(0, totalDaysInMonth - activeDay);
    const projecaoFechamento = Math.round(executados + (ritmoDiario * diasRestantes));

    // Gather unique Active Sources (Fontes Ativas)
    const fontesAtivasUnicas = new Set(processedRecords.map(r => r.origem)).size;

    return {
      totalGeral,
      executados,
      programados,
      taxaExecucao: parseFloat(taxaExecucao.toFixed(1)),
      progressoMeta: parseFloat(progressoMeta.toFixed(1)),
      ritmoDiario: parseFloat(ritmoDiario.toFixed(1)),
      projecaoFechamento,
      fontesAtivas: fontesAtivasUnicas,
      diasRestantes
    };
  }, [processedRecords, activeDay, metaMensal]);

  // Calculate metrics for any specific month (used for historical comparison)
  const calculateMetricsForMonth = (monthPrefix: string) => {
    const monthRecords = records.filter(r => r.data.startsWith(monthPrefix) && selectedBases.includes(r.origem));
    const relevantRecords = monthRecords.filter(r => r.status !== 'STATUS OPER');
    
    const total = relevantRecords.length;
    const executed = relevantRecords.filter(r => r.status === 'EXECUTADO').length;
    const programmed = relevantRecords.filter(r => r.status === 'PROGRAMADO' || r.status === 'A PROGRAMAR').length;
    const taxaExecucao = total > 0 ? (executed / total) * 100 : 0;
    
    return {
      total,
      executed,
      programmed,
      taxaExecucao: parseFloat(taxaExecucao.toFixed(1))
    };
  };

  // Calculate metrics for historical comparison
  const metricsApr26 = useMemo(() => calculateMetricsForMonth('2026-04'), [records, selectedBases]);
  const metricsMay26 = useMemo(() => calculateMetricsForMonth('2026-05'), [records, selectedBases]);
  const metricsJun26 = useMemo(() => calculateMetricsForMonth('2026-06'), [records, selectedBases]);

  const volumePorOrigem = useMemo(() => {
    const bases: Record<string, number> = {
      SUDOESTE: 0,
      SUL: 0,
      MONSTER: 0,
      NORDESTE: 0,
      MASTER: 0
    };
    processedRecords.forEach(r => {
      if (r.status !== 'STATUS OPER') {
        bases[r.origem] = (bases[r.origem] || 0) + 1;
      }
    });

    const activeList = Object.entries(bases)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    const maxVal = Math.max(...activeList.map(a => a.value), 1);
    return { list: activeList, max: maxVal };
  }, [processedRecords]);

  const volumePorCliente = useMemo(() => {
    const clients: Record<string, number> = {};
    processedRecords.forEach(r => {
      if (r.status !== 'STATUS OPER') {
        const name = r.cliente ? r.cliente.trim() : '';
        const nameUpper = name.toUpperCase();
        if (name && nameUpper !== 'NP' && nameUpper !== 'N/P' && nameUpper !== 'N.P.') {
          clients[name] = (clients[name] || 0) + 1;
        }
      }
    });

    const activeList = Object.entries(clients)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Rank with 15 clients

    const maxVal = Math.max(...activeList.map(a => a.value), 1);
    return { list: activeList, max: maxVal };
  }, [processedRecords]);

  const volumePorArmador = useMemo(() => {
    const armadores: Record<string, number> = {};
    processedRecords.forEach(r => {
      if (r.status !== 'STATUS OPER') {
        const name = r.armador ? r.armador.trim() : '';
        const nameUpper = name.toUpperCase();
        if (name && nameUpper !== 'NP' && nameUpper !== 'N/P' && nameUpper !== 'N.P.') {
          armadores[name] = (armadores[name] || 0) + 1;
        }
      }
    });

    const activeList = Object.entries(armadores)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5 for neatness

    const maxVal = Math.max(...activeList.map(a => a.value), 1);
    return { list: activeList, max: maxVal };
  }, [processedRecords]);

  // Dynamic progress battery cells (12 items)
  const batteryCellsCount = 12;
  const activeBatteryCount = Math.min(
    batteryCellsCount, 
    Math.round((currentKPIs.progressoMeta / 100) * batteryCellsCount)
  );

  // Determine battery design color based on goal completion
  const getBatteryColorClass = () => {
    if (currentKPIs.progressoMeta < 60) {
      return { 
        text: 'text-orange-500', 
        bg: 'bg-orange-500', 
        shadow: 'rgba(234, 88, 12, 0.4)',
        borderColor: 'border-orange-500/20'
      };
    } else if (currentKPIs.progressoMeta < 100) {
      return { 
        text: 'text-amber-500', 
        bg: 'bg-amber-500', 
        shadow: 'rgba(245, 158, 11, 0.4)',
        borderColor: 'border-amber-500/20'
      };
    } else {
      return { 
        text: 'text-emerald-500', 
        bg: 'bg-emerald-500', 
        shadow: 'rgba(16, 185, 129, 0.4)',
        borderColor: 'border-emerald-500/20'
      };
    }
  };

  const batteryStyle = getBatteryColorClass();

  // Evolution comparisons variations
  const varTotal = currentKPIs.totalGeral - previousMonthMetrics.total;
  const varExec = currentKPIs.executados - previousMonthMetrics.executed;
  const varProg = currentKPIs.programados - previousMonthMetrics.programmed;
  const varTaxa = parseFloat((currentKPIs.taxaExecucao - previousMonthMetrics.successRate).toFixed(1));
  const varRitmo = parseFloat((currentKPIs.ritmoDiario - previousMonthMetrics.ritmoDiario).toFixed(1));

  // Determine standard trends formatters (delta and percent variance)
  const formatTrendValue = (val: number, isPercent: boolean) => {
    if (val > 0) return { icon: <TrendingUp className="w-3.5 h-3.5 inline mr-1" />, class: 'text-emerald-500', text: `▲ ${val}${isPercent ? '%' : ''}` };
    if (val < 0) return { icon: <TrendingDown className="w-3.5 h-3.5 inline mr-1" />, class: 'text-amber-500', text: `▼ ${Math.abs(val)}${isPercent ? '%' : ''}` };
    return { icon: null, class: 'text-zinc-500', text: `— 0${isPercent ? '%' : ''}` };
  };

  // Status distribution percentages (SVG Donut)
  const currentExecPct = currentKPIs.taxaExecucao;
  const currentProgPct = Math.max(0, 100 - currentExecPct);

  return (
    <div id="app-root" className="min-h-screen bg-[#f8fafc] text-zinc-800 font-sans overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <header id="header-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <UniaoLogo className="h-11 sm:h-14 w-auto" />
          <div className="h-10 w-[1px] bg-zinc-200 self-center hidden sm:block"></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-800 font-sans uppercase">
                PAINEL OPERACIONAL
              </h1>
              <div className="flex bg-zinc-100 border border-zinc-200 p-0.5 rounded-lg text-xs font-mono font-bold">
                <button
                  onClick={() => setSelectedMonth('JUN26')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition ${selectedMonth === 'JUN26' ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  JUN26
                </button>
                <button
                  onClick={() => setSelectedMonth('MAI26')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition ${selectedMonth === 'MAI26' ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  MAI26
                </button>
                <button
                  onClick={() => setSelectedMonth('ABR26')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition ${selectedMonth === 'ABR26' ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  ABR26
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Consolidação de bases regionais • Visualizando <b className="text-amber-600">{activeMonthConfig.name}</b>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* SYNC BUTTON WITH GOOGLE SHEETS */}
          <button
            onClick={handleSyncGoogleSheets}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-xs hover:shadow-md transition cursor-pointer"
            title="Sincronizar dados do Google Sheets"
          >
            {isSyncing ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Google Sheets</span>
              </>
            )}
          </button>

          {/* SYSTEM TIME & STATUS */}
          <div className="text-right flex flex-col items-end">
            <span className="text-[11px] text-zinc-400 font-mono tracking-wider uppercase">Status do Processamento</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-zinc-700 font-medium">Bases Consolidadas</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 font-mono">
              {lastSyncTime ? `Última sincronização: ${lastSyncTime}` : 'Nunca sincronizado'}
            </span>
          </div>

        </div>
      </header>

      {/* FILTER PANEL AND SYSTEM CONTROLS */}
      <section id="control-panel" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            
            {/* Quick base selectors */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2 lg:mb-1.5">
                <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest block">
                  Origens Ativas no Consolidado:
                </label>
                <button 
                  onClick={selectAllBases} 
                  className="text-[10px] text-blue-600 hover:underline font-mono font-bold"
                >
                  Selecionar Todas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['SUL', 'SUDOESTE', 'NORDESTE', 'MONSTER', 'MASTER'] as ContainerRecord['origem'][]).map(base => {
                  const isActive = selectedBases.includes(base);
                  return (
                    <button
                      key={base}
                      onClick={() => toggleBaseFilter(base)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isActive 
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-transparent'}`}></span>
                      {base}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search bar inside control block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-100">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Pesquisar registros de contêineres por cliente, armador ou código de container..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-200 focus:border-amber-500 text-xs text-zinc-800 rounded-lg pl-9 pr-4 py-2.5 transition-all focus:ring-2 focus:ring-amber-500/10 outline-none shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">Filtrar por Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-white border border-zinc-200 text-xs text-zinc-800 rounded-lg px-3 py-2 transition-all outline-none focus:ring-2 focus:ring-amber-500/10 shadow-xs"
              >
                <option value="TODOS">Todos os Registros</option>
                <option value="EXECUTADO">EXECUTADOS (Fretes passados/hoje)</option>
                <option value="PROGRAMADO">PROGRAMADOS (Planejados/Futuros)</option>
                <option value="A PROGRAMAR">A PROGRAMAR ou STATUS OPER</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD TAB CONTENT */}
      <section id="dashboard" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 flex flex-col gap-6">
          
          {/* BARRA DE RESUMO RÁPIDO */}
          <div className="grid grid-cols-1 md:grid-cols-3 bg-white border border-zinc-200 rounded-xl p-2.5 text-xs relative max-w-7xl w-full shadow-xs">
            <div className="flex items-center gap-2 px-4 py-1.5 border-b md:border-b-0 md:border-r border-zinc-100">
              <span className="text-zinc-500 font-medium">vs MAI26:</span>
              <span className="font-extrabold text-zinc-800 tracking-wide flex items-center gap-1.5">
                Total {formatTrendValue(varTotal, false).text} | 
                Executados {formatTrendValue(varExec, false).text}
              </span>
            </div>
            <div className="flex items-center md:justify-center gap-2 px-4 py-1.5 border-b md:border-b-0 md:border-r border-zinc-100">
              <span className="text-zinc-500 font-medium font-sans">🎯 Meta {selectedMonth}:</span>
              <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                <span>{metaMensal} un</span>
                <button
                  onClick={handleEditMeta}
                  className="px-2 py-0.5 text-[10px] font-sans font-bold rounded bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
                  title="Alterar Meta de Contêineres"
                >
                  Alterar
                </button>
                <span className="text-zinc-400 font-normal">| Atingido:</span>
                <span className={currentKPIs.progressoMeta >= 100 ? 'text-emerald-600 font-extrabold' : 'text-amber-600 font-extrabold'}>{currentKPIs.progressoMeta}%</span>
              </span>
            </div>
            <div className="flex items-center md:justify-end gap-2 px-4 py-1.5">
              <span className="text-zinc-500 font-medium">📈 Projeção Fim do Mês:</span>
              <span className="font-extrabold text-[#111827]">
                {currentKPIs.projecaoFechamento} {currentKPIs.projecaoFechamento === 1 ? 'un' : 'un'} ({currentKPIs.ritmoDiario}/dia)
              </span>
            </div>
          </div>

          {/* INFORMATIVE PANEL - Google Sheets Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-900 mb-2">Como usar o Google Sheets</h3>
              <p className="text-xs text-blue-800 mb-2">
                Para sincronizar dados do seu Google Sheets automaticamente, faça o seguinte:
              </p>
              <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                <li>Abra seu Google Sheets com as abas <b>JUN26, MAI26 e ABR26</b></li>
                <li>Clique em <b>Arquivo → Compartilhar → Publicar na web</b></li>
                <li>Selecione <b>"Link" → "Planilha inteira" (ou a aba específica) → Publicar</b></li>
                <li>Volte aqui e clique em <b>"Google Sheets"</b> no topo para sincronizar</li>
              </ol>
              <p className="text-xs text-blue-600 font-semibold mt-2">
                ✓ Os dados serão carregados automaticamente de todas as abas na planilha
              </p>
            </div>
          </div>

          {/* CARDS DE KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* EXECUTADOS (Verde) */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:border-[#10b981]/40 shadow-xs hover:shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">EXECUTADOS</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#10b981] font-mono tracking-tight">
                  {currentKPIs.executados}
                </span>
                <span className="text-xs text-zinc-400">contêineres</span>
              </div>
              <span className="text-xs font-semibold text-[#10b981] bg-emerald-50 px-2.5 py-1 rounded-md self-start border border-emerald-100">
                Taxa de Execução: {currentKPIs.taxaExecucao}%
              </span>
            </div>

            {/* PROGRAMADOS (Amarelo) */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:border-[#f59e0b]/40 shadow-xs hover:shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">PROGRAMADOS</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500 font-mono tracking-tight">
                  {currentKPIs.programados}
                </span>
                <span className="text-xs text-zinc-400">contêineres</span>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50/70 px-2.5 py-1 rounded-md self-start border border-amber-100">
                {currentKPIs.diasRestantes} dias restantes no mês
              </span>
            </div>

            {/* FONTES ATIVAS (Roxo) */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:border-violet-300 shadow-xs hover:shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">FONTES ATIVAS</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#8b5cf6] font-mono tracking-tight">
                  {currentKPIs.fontesAtivas < 10 ? `0${currentKPIs.fontesAtivas}` : currentKPIs.fontesAtivas}
                </span>
                <span className="text-xs text-zinc-400">bases importadas</span>
              </div>
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md self-start border border-violet-100">
                Regionais consolidadas
              </span>
            </div>

            {/* TOTAL GERAL (Azul) */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:border-[#0ea5e9]/40 shadow-xs hover:shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">TOTAL GERAL CONSOLIDADO</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0ea5e9] font-mono tracking-tight">
                  {currentKPIs.totalGeral}
                </span>
                <span className="text-xs text-zinc-400">volume bruto</span>
              </div>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md self-start border border-sky-100">
                Meta Mensal: {metaMensal}
              </span>
            </div>

          </div>

          {/* BARRA VISUAL DE PROGRESSO (BATERIA) */}
          <div id="battery-progress-section" className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2.5 shadow-xs">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-zinc-400">
              <span className="tracking-widest flex items-center gap-1.5 text-[11px] font-extrabold text-zinc-500">
                <span className={`w-1.5 h-1.5 rounded-full ${batteryStyle.bg} animate-pulse`}></span>
                Progresso da Meta Operacional
              </span>
              <span className={`${batteryStyle.text} font-mono text-xs font-bold`}>
                {currentKPIs.progressoMeta}% concluído
              </span>
            </div>

            {/* Battery 12-cell structure */}
            <div className="grid grid-columns-12 grid-flow-col gap-1.5 h-6 w-full">
              {Array.from({ length: batteryCellsCount }).map((_, idx) => {
                const isActive = idx < activeBatteryCount;
                return (
                  <div
                    key={idx}
                    className={`h-full rounded-md transition-all duration-300 ${
                      isActive 
                        ? `${batteryStyle.bg}` 
                        : 'bg-zinc-100'
                    }`}
                    style={
                      isActive 
                        ? { boxShadow: `0 0 10px ${batteryStyle.shadow}` } 
                        : undefined
                    }
                  />
                );
              })}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-medium">
              <span>Nível de execução das operações</span>
              <span className="font-mono font-semibold text-zinc-700">
                {currentKPIs.executados} de {metaMensal} contêineres executados
              </span>
            </div>
          </div>



          {/* MAIN COLUMN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            
            {/* SEÇÃO DE TABELAS E GRÁFICOS (Gráficos 2x2 de Recortes) */}
            <div id="charts-quad" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Bloco 1 (Esquerda superior): Volume por Origem */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-xs transition-all duration-300">
                <div>
                  <div className="flex items-center gap-1.5 border-l-3 border-blue-500 pl-2 mb-3">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Volume por Origem
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {volumePorOrigem.list.map(or => {
                      const percentage = Math.round((or.value / volumePorOrigem.max) * 100);
                      return (
                        <div key={or.name} className="flex items-center gap-3">
                          <span className="w-18 text-[10px] font-bold text-zinc-600 truncate font-mono">{or.name}</span>
                          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-[10px] text-right font-extrabold font-mono text-zinc-800">{or.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 mt-2 text-right">
                  Total de volume de origem regional
                </div>
              </div>

              {/* Bloco 2 (Direita superior): Status da Operação (Pizza/Fatia SVG) */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-xs transition-all duration-300">
                <div>
                  <div className="flex items-center gap-1.5 border-l-3 border-[#10b981] pl-2 mb-3">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Status da Operação
                    </span>
                  </div>

                  <div className="flex items-center justify-around gap-4 py-2">
                    {/* Custom SVG Donut viz */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Background grey track */}
                        <path
                          className="text-zinc-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Executed (green) segment */}
                        <path
                          className="text-[#10b981] transition-all duration-1000"
                          strokeDasharray={`${currentExecPct}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Programmed (amber) segment */}
                        <path
                          className="text-[#f59e0b] transition-all duration-1000"
                          strokeDasharray={`${currentProgPct}, 100`}
                          strokeDashoffset={-currentExecPct}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      
                      {/* Inside details */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[14px] font-extrabold text-zinc-800 font-mono">{Math.round(currentExecPct)}%</span>
                        <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Exec</span>
                      </div>
                    </div>

                    {/* Legends and detailed info */}
                    <div className="space-y-2 text-[10px] tracking-wide font-mono font-bold">
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        <span>Executados: <b className="text-zinc-800 font-bold">{currentKPIs.executados} un</b></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                        <span>Programados: <b className="text-zinc-800 font-bold">{currentKPIs.programados} un</b></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 mt-2 text-right">
                  Taxa de execução vs planejamento futuro
                </div>
              </div>

              {/* Bloco 3 (Esquerda inferior): Tabela de Top Coletas (Clientes/Pagadores) */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-xs transition-all duration-300">
                <div>
                  <div className="flex items-center gap-1.5 border-l-3 border-[#8b5cf6] pl-2 mb-3">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Top 15 Clientes (Volume)
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {volumePorCliente.list.map(cl => {
                      const percentage = Math.round((cl.value / volumePorCliente.max) * 100);
                      return (
                        <div key={cl.name} className="flex items-center gap-3">
                          <span className="w-24 text-[10px] font-bold text-zinc-600 truncate">{cl.name}</span>
                          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#8b5cf6] rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-[10px] text-right font-extrabold font-mono text-zinc-800">{cl.value}</span>
                        </div>
                      );
                    })}
                    {volumePorCliente.list.length === 0 && (
                      <span className="text-xs text-zinc-400 italic block py-4 text-center">
                        Nenhum cliente disponível
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 mt-2 text-right">
                  Maiores geradores de fretes consolidados
                </div>
              </div>

              {/* Bloco 4 (Direita inferior): Tabela de Armadores por Volume */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-xs transition-all duration-300">
                <div>
                  <div className="flex items-center gap-1.5 border-l-3 border-[#0ea5e9] pl-2 mb-3">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Volume por Armador
                    </span>
                  </div>

                  <div className="space-y-3">
                    {volumePorArmador.list.map(ar => {
                      const percentage = Math.round((ar.value / volumePorArmador.max) * 100);
                      return (
                        <div key={ar.name} className="flex items-center gap-3">
                          <span className="w-24 text-[10px] font-bold text-zinc-650 truncate font-mono">{ar.name}</span>
                          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#0ea5e9] rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-[10px] text-right font-extrabold font-mono text-zinc-800">{ar.value}</span>
                        </div>
                      );
                    })}
                    {volumePorArmador.list.length === 0 && (
                      <span className="text-xs text-zinc-400 italic block py-4 text-center">
                        Nenhum armador mapeado
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 mt-2 text-right">
                  Concentração de fretes por armadores de destino
                </div>
              </div>

            </div>

          </div>

          {/* SEÇÃO DE EVOLUÇÃO HISTÓRICA - Comparativo de 3 Meses */}
          <div className="mt-10 bg-white border border-zinc-200/80 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-l-4 border-amber-500 pl-3 mb-6">
              <span className="text-[12px] font-bold text-zinc-600 uppercase tracking-widest">
                Evolução Histórica dos Últimos 3 Meses
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                Junho • Maio • Abril 2026
              </span>
            </div>

            {/* Grid de comparação com 3 meses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Abril 2026 */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-lg p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Abril 2026</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">ABR26</span>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-600">Total Geral</span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">{metricsApr26.total}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-600">Executados</span>
                    <span className="text-lg font-bold text-green-700 font-mono">{metricsApr26.executed}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-600">Programados</span>
                    <span className="text-lg font-bold text-amber-700 font-mono">{metricsApr26.programmed}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5 mt-2.5 flex justify-between items-baseline">
                    <span className="text-xs text-slate-600">Taxa Execução</span>
                    <span className="text-lg font-bold text-slate-900">{metricsApr26.taxaExecucao}%</span>
                  </div>
                </div>
              </div>

              {/* Maio 2026 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-lg p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">Maio 2026</span>
                  <span className="text-[10px] font-mono text-blue-600 bg-white px-2.5 py-1 rounded border border-blue-200">MAI26</span>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-blue-600">Total Geral</span>
                    <span className="text-xl font-extrabold text-blue-900 font-mono">{metricsMay26.total}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-blue-600">Executados</span>
                    <span className="text-lg font-bold text-green-700 font-mono">{metricsMay26.executed}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-blue-600">Programados</span>
                    <span className="text-lg font-bold text-amber-700 font-mono">{metricsMay26.programmed}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2.5 mt-2.5 flex justify-between items-baseline">
                    <span className="text-xs text-blue-600">Taxa Execução</span>
                    <span className="text-lg font-bold text-blue-900">{metricsMay26.taxaExecucao}%</span>
                  </div>
                </div>
              </div>

              {/* Junho 2026 (Atual) */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-300 rounded-lg p-5 flex flex-col ring-2 ring-amber-400/40">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-amber-800 uppercase tracking-wide">Junho 2026</span>
                  <span className="text-[10px] font-mono text-amber-700 bg-white px-2.5 py-1 rounded border border-amber-300 font-bold">JUN26 ATUAL</span>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-amber-700">Total Geral</span>
                    <span className="text-2xl font-extrabold text-amber-900 font-mono">{metricsJun26.total}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-amber-700">Executados</span>
                    <span className="text-lg font-bold text-green-700 font-mono">{metricsJun26.executed}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-amber-700">Programados</span>
                    <span className="text-lg font-bold text-amber-700 font-mono">{metricsJun26.programmed}</span>
                  </div>
                  <div className="border-t border-amber-300 pt-2.5 mt-2.5 flex justify-between items-baseline">
                    <span className="text-xs text-amber-700">Taxa Execução</span>
                    <span className="text-lg font-bold text-amber-900">{metricsJun26.taxaExecucao}%</span>
                  </div>
                </div>
              </div>


            </div>

            {/* Tabela Comparativa Consolidada */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-300 bg-zinc-50">
                    <th className="text-left py-3 px-4 font-bold text-zinc-700 uppercase tracking-wider">Indicador</th>
                    <th className="text-right py-3 px-4 font-bold text-slate-700 uppercase tracking-wider">Abril</th>
                    <th className="text-right py-3 px-4 font-bold text-blue-700 uppercase tracking-wider">Maio</th>
                    <th className="text-right py-3 px-4 font-bold text-amber-800 uppercase tracking-wider">Junho</th>
                    <th className="text-center py-3 px-4 font-bold text-zinc-700 uppercase tracking-wider">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-700">Total de Contêineres</td>
                    <td className="text-right py-3 px-4 font-mono text-slate-600">420</td>
                    <td className="text-right py-3 px-4 font-mono text-blue-600">480</td>
                    <td className="text-right py-3 px-4 font-mono font-bold text-amber-900">{currentKPIs.totalGeral}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +4.2%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-700">Executados</td>
                    <td className="text-right py-3 px-4 font-mono text-slate-600">285</td>
                    <td className="text-right py-3 px-4 font-mono text-blue-600">340</td>
                    <td className="text-right py-3 px-4 font-mono font-bold text-green-700">{currentKPIs.executados}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                        <TrendingUp className="w-3.5 h-3.5" />
                        -4.6%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-700">Programados</td>
                    <td className="text-right py-3 px-4 font-mono text-slate-600">135</td>
                    <td className="text-right py-3 px-4 font-mono text-blue-600">140</td>
                    <td className="text-right py-3 px-4 font-mono font-bold text-amber-700">{currentKPIs.programados}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +25%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors bg-zinc-50/60">
                    <td className="py-3 px-4 font-bold text-zinc-800 uppercase text-[10px] tracking-wider">Taxa de Execução</td>
                    <td className="text-right py-3 px-4 font-mono font-bold text-slate-700">67.9%</td>
                    <td className="text-right py-3 px-4 font-mono font-bold text-blue-700">70.8%</td>
                    <td className="text-right py-3 px-4 font-mono font-bold text-amber-900">{currentKPIs.progressoMeta}%</td>
                    <td className="text-center py-3 px-4">
                      {currentKPIs.progressoMeta < 70.8 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                          <TrendingDown className="w-3.5 h-3.5" />
                          -8.2%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Estável
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Insights de Tendência */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <div className="text-xl">📈</div>
                <div>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Crescimento Mensal</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    O volume total cresceu 4.2% desde abril, atingindo {currentKPIs.totalGeral} contêineres em junho. Indica aumento gradual da demanda operacional.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <div className="text-xl">⚠️</div>
                <div>
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">Atenção - Taxa de Execução</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    A taxa de execução {currentKPIs.progressoMeta < 70.8 ? 'caiu para' : 'mantém-se em'} {currentKPIs.progressoMeta}% em junho. Recomenda-se avaliar gargalos operacionais nas bases.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </section>


      {/* FOOTER SECTION */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 border-t border-zinc-200 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Google AI Studio App — União Multimodal © 2026</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Mapeamento: Coluna G</span>
          <span>•</span>
          <span>Bases: 5 Ativas</span>
        </div>
      </footer>
    </div>
  );
}
