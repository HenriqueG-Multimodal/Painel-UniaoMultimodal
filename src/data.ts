import * as XLSX from 'xlsx';

/**
 * Data management and Google Sheets mock data generator for the Operational Dashboard.
 */

export interface ContainerRecord {
  id: string;
  origem: 'SUL' | 'SUDOESTE' | 'NORDESTE' | 'MONSTER' | 'MASTER';
  data: string; // YYYY-MM-DD
  cliente: string;
  armador: string;
  container: string; // Columns G
  status: 'EXECUTADO' | 'PROGRAMADO' | 'STATUS OPER' | 'A PROGRAMAR';
}

// Lists of typical entities to generate realistic data
export const CLIENTS = [
  'LogiCorp SA',
  'Global Trans',
  'Brasil Express',
  'Multimodal Solutions',
  'Apex Cargo',
  'União Logística',
  'Intermodal Corp',
  'Nordic Shipping',
  'Sudoeste Log',
  'Atlas Transportes'
];

export const ARMADORES = [
  'MSC',
  'MAERSK',
  'HAPAG-LLOYD',
  'CMA CGM',
  'COSCO',
  'ONE Line',
  'Evergreen',
  'Hamburg Süd'
];

/**
 * Deterministically generates June and May datasets that perfectly match the requested dashboard totals.
 */
export function generateDefaultData(): ContainerRecord[] {
  const records: ContainerRecord[] = [];
  let idCounter = 1;

  // Expected June targets:
  // Total June = 500. SuloEste = 145, Sul = 112, Monster = 88, Nordeste = 65, Master = 90.
  // Executed June = 325. Programmed June = 175.
  const JuneBases: { name: ContainerRecord['origem']; total: number; exec: number }[] = [
    { name: 'SUDOESTE', total: 145, exec: 95 },
    { name: 'SUL', total: 112, exec: 72 },
    { name: 'MONSTER', total: 88, exec: 58 },
    { name: 'NORDESTE', total: 65, exec: 40 },
    { name: 'MASTER', total: 90, exec: 60 }
  ];

  // Helper to get matching container codes
  const generateContainerCode = (index: number) => {
    const letters = 'MSCU MAEU SUDU HLCU'.split(' ');
    const prefix = letters[index % letters.length];
    const num = Math.floor(100000 + (index * 1337) % 900000);
    return `${prefix}${num}`;
  };

  // Generate June 2026 data.
  // We assume Report Date is June 23, 2026.
  // Executed: date is in June (1 to 23), container is valid.
  // Programmed: date is June (24 to 30), or empty "A PROGRAMAR".
  JuneBases.forEach(base => {
    let baseExecCount = 0;
    
    for (let i = 0; i < base.total; i++) {
      const isExec = baseExecCount < base.exec;
      if (isExec) baseExecCount++;

      // Client distribution
      let client = CLIENTS[i % CLIENTS.length];
      if (base.name === 'SUDOESTE' && i % 3 === 0) client = 'LogiCorp SA';
      if (base.name === 'SUL' && i % 4 === 0) client = 'Global Trans';
      if (base.name === 'MONSTER' && i % 2 === 0) client = 'Brasil Express';

      // Armador distribution
      let armador = ARMADORES[i % ARMADORES.length];
      if (i % 3 === 0) armador = 'MSC';
      else if (i % 5 === 0) armador = 'MAERSK';
      else if (i % 7 === 0) armador = 'HAPAG-LLOYD';

      let date = '';
      let status: ContainerRecord['status'] = 'PROGRAMADO';
      let container = '';

      if (isExec) {
        // past day in June (1 to 23)
        const day = (i % 23) + 1;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        date = `2026-06-${dayStr}`;
        status = 'EXECUTADO';
        container = generateContainerCode(idCounter);
      } else {
        // Future day in June (24 to 30) or empty/programar
        if (i % 5 === 0) {
          date = '';
          status = 'A PROGRAMAR';
          container = 'A PROGRAMAR';
        } else {
          const day = 24 + (i % 7);
          date = `2026-06-${day}`;
          status = 'PROGRAMADO';
          container = generateContainerCode(idCounter);
        }
      }

      records.push({
        id: `JUN-${idCounter++}`,
        origem: base.name,
        data: date,
        cliente: client,
        armador: armador,
        container: container,
        status: status
      });
    }
  });

  // Generate May 2026 data.
  // May Total = 480. Executed = 340. Programmed = 140.
  const MayBases: { name: ContainerRecord['origem']; total: number; exec: number }[] = [
    { name: 'SUDOESTE', total: 135, exec: 98 },
    { name: 'SUL', total: 108, exec: 76 },
    { name: 'MONSTER', total: 85, exec: 60 },
    { name: 'NORDESTE', total: 62, exec: 44 },
    { name: 'MASTER', total: 90, exec: 62 }
  ];

  MayBases.forEach(base => {
    let baseExecCount = 0;
    for (let i = 0; i < base.total; i++) {
      const isExec = baseExecCount < base.exec;
      if (isExec) baseExecCount++;

      let client = CLIENTS[(i + 2) % CLIENTS.length];
      let armador = ARMADORES[(i + 1) % ARMADORES.length];
      if (i % 4 === 0) armador = 'MSC';

      let date = '';
      let status: ContainerRecord['status'] = 'PROGRAMADO';
      let container = '';

      if (isExec) {
        const day = (i % 31) + 1;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        date = `2026-05-${dayStr}`;
        status = 'EXECUTADO';
        container = generateContainerCode(idCounter);
      } else {
        if (i % 6 === 0) {
          date = '';
          status = 'A PROGRAMAR';
          container = 'A PROGRAMAR';
        } else {
          const day = 25 + (i % 6);
          date = `2026-05-${day}`;
          status = 'PROGRAMADO';
          container = generateContainerCode(idCounter);
        }
      }

      records.push({
        id: `MAY-${idCounter++}`,
        origem: base.name,
        data: date,
        cliente: client,
        armador: armador,
        container: container,
        status: status
      });
    }
  });

  return records;
}

/**
 * Parses dynamic CSV text retrieved from a Google Sheets CSV publication or file upload.
 * It maps columns for best fit based on names, supporting semicolons and commas and BR date types.
 */
export function parseGoogleSheetCSV(csvText: string, defaultOrigem: ContainerRecord['origem']): ContainerRecord[] {
  if (!csvText || csvText.trim() === '') return [];
  
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Detect delimiter at headers line
  const firstLine = lines[0];
  const semicCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicCount > commaCount ? ';' : ',';

  // Simple CSV line splitter that respects double quotes and the detected delimiter
  const parseCSVLine = (line: string, delim: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = parseCSVLine(lines[0], delimiter).map(h => {
    // Remove quotes and make uppercase for easier matching
    return h.replace(/^["']|["']$/g, '').trim().toUpperCase();
  });
  
  // Find column indices with highly forgiving regional equivalents
  const colDateIdx = headers.findIndex(h => 
    h.includes('DATA') || h.includes('DATE') || h.includes('FRETE') || h.includes('DT_') || h.includes('DIA') || h.includes('EMISS')
  );
  
  const colClientIdx = headers.findIndex(h => 
    h.includes('CLIENTE') || h.includes('PAGADOR') || h.includes('COLETA') || h.includes('COMPANY') || h.includes('EMPRESA') || h.includes('DESTI')
  );
  
  const colArmadorIdx = headers.findIndex(h => 
    h.includes('ARMADOR') || h.includes('LINER') || h.includes('SHIP') || h.includes('DRAFT') || h.includes('AGENTE') || h.includes('AGENCY')
  );
  
  const colStatusIdx = headers.findIndex(h => 
    h.includes('STATUS') || h.includes('SITUA') || h.includes('EXECU') || h.includes('SITUACAO')
  );
  
  // Container index is typically G (7th column, index 6), or has 'CONT' / 'CONTAINER' / 'EQUIP' in header
  let colContainerIdx = headers.findIndex(h => 
    h.includes('CONT') || h.includes('EQUIP') || h.includes('CODI') || h.includes('COD.') || h.includes('G') || h.includes('NÚMERO') || h.includes('NUMERO') || h.includes('CNTR')
  );
  
  // Fallback to column G (index 6) if not detected but we have enough headers, else use last column
  if (colContainerIdx === -1) {
    if (headers.length > 6) {
      colContainerIdx = 6;
    } else {
      colContainerIdx = headers.length - 1;
    }
  }

  const importedRecords: ContainerRecord[] = [];
  let idCount = 1000;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    const cells = parseCSVLine(line, delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cells.length < 2) continue;

    // Extract values
    const rawDate = colDateIdx !== -1 && colDateIdx < cells.length ? cells[colDateIdx] : '';
    const client = colClientIdx !== -1 && colClientIdx < cells.length && cells[colClientIdx] ? cells[colClientIdx] : 'Cliente Geral';
    const armador = colArmadorIdx !== -1 && colArmadorIdx < cells.length && cells[colArmadorIdx] ? cells[colArmadorIdx] : 'Armador Geral';
    const statusRaw = colStatusIdx !== -1 && colStatusIdx < cells.length ? cells[colStatusIdx].toUpperCase() : '';
    const containerRaw = colContainerIdx < cells.length ? cells[colContainerIdx] : '';
    const container = containerRaw && containerRaw.trim() !== '' ? containerRaw : 'A PROGRAMAR';

    // Standardize status:
    let finalStatus: ContainerRecord['status'] = 'PROGRAMADO';
    if (statusRaw.includes('STATUS OPER') || statusRaw === 'OPER') {
      finalStatus = 'STATUS OPER';
    } else if (statusRaw.includes('EXEC') || statusRaw.includes('CONCLU') || statusRaw.includes('PAGO') || statusRaw.includes('SIM')) {
      finalStatus = 'EXECUTADO';
    } else if (statusRaw.includes('PROG')) {
      finalStatus = 'PROGRAMADO';
    } else if (statusRaw.includes('A PROGRAMAR') || statusRaw.includes('AGEND') || !rawDate) {
      finalStatus = 'A PROGRAMAR';
    } else {
      // Determine by container validity & date
      const hasValidContainer = container && container.trim() !== '' && container !== 'A PROGRAMAR';
      if (hasValidContainer) {
        finalStatus = 'EXECUTADO';
      }
    }

    // Format date beautifully if possible
    let formattedDate = rawDate;
    if (rawDate) {
      // Try to parse dd/mm/yyyy or dd/mm/yy
      const regexBR = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
      const match = rawDate.match(regexBR);
      if (match) {
        let yearDigit = match[3];
        if (yearDigit.length === 2) {
          yearDigit = `20${yearDigit}`; // assume 20xx for 2-digit years
        }
        formattedDate = `${yearDigit}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      } else {
        // Check if matches standard yyyy-mm-dd
        const regexISO = /^(\d{4})-(\d{1,2})-(\d{1,2})/;
        const matchISO = rawDate.match(regexISO);
        if (matchISO) {
          formattedDate = `${matchISO[1]}-${matchISO[2].padStart(2, '0')}-${matchISO[3].padStart(2, '0')}`;
        }
      }
    }

    importedRecords.push({
      id: `IMPORT-${idCount++}`,
      origem: defaultOrigem,
      data: formattedDate,
      cliente: client,
      armador: armador,
      container: container,
      status: finalStatus
    });
  }

  return importedRecords;
}

/**
 * Parses a consolidated Excel spreadsheet (.xlsx/.xls) reading sheets: JUN26, MAI26, ABR26.
 * All other sheets are ignored.
 */
export function parseExcelSpreadsheet(arrayBuffer: ArrayBuffer): {
  records: ContainerRecord[];
  sheetsFound: string[];
} {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const records: ContainerRecord[] = [];
  const sheetsFound: string[] = [];

  // Expected target sheet codes
  const targetSheets = ['JUN26', 'MAI26', 'ABR26'];

  // Iterate sheet names and match ONLY those containing JUN26, MAI26, or ABR26
  for (const sheetName of workbook.SheetNames) {
    const upperSheetName = sheetName.toUpperCase().replace(/\s/g, '');
    
    // Strict matching of JUN26, MAI26, ABR26 (ignoring extraneous sheets such as JUNHO, MAIO etc. unless they explicitly contain the target code)
    const matchedTarget = targetSheets.find(target => 
      upperSheetName === target || 
      upperSheetName.includes(target)
    );

    if (matchedTarget) {
      sheetsFound.push(sheetName);
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to 2D array
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
      if (rows.length < 2) continue;

      // Find the header row dynamically (usually index 0, but scanning up to 15 rows for top-level robustness)
      let headerRowIdx = 0;
      let headers: string[] = [];
      
      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        const candidateHeaders = row.map((cell: any) => String(cell || '').trim().toUpperCase());
        
        const hasKeyMatch = candidateHeaders.some(h => 
          h.includes('DATA') || h.includes('FRETE') || h.includes('CLIENTE') || 
          h.includes('PAGADOR') || h.includes('ARMADOR') || h.includes('STATUS') || 
          h.includes('CONTAINER') || h.includes('CONTÊINER') || h.includes('REGIONAL') ||
          h.includes('ORIGEM') || h.includes('FONTE')
        );
        if (hasKeyMatch && candidateHeaders.filter(h => h !== '').length > 3) {
          headerRowIdx = r;
          headers = candidateHeaders;
          break;
        }
      }

      if (headers.length === 0) {
        headerRowIdx = 0;
        headers = rows[0].map((cell: any) => String(cell || '').trim().toUpperCase());
      }

      // Identify header index fallbacks
      const colDateIdx = headers.findIndex(h => 
        h.includes('DATA') || h.includes('DATE') || h.includes('FRETE') || h.includes('DT_') || h.includes('DIA') || h.includes('EMISS')
      );
      const colClientIdx = headers.findIndex(h => 
        h.includes('CLIENTE') || h.includes('PAGADOR') || h.includes('COLETA') || h.includes('COMPANY') || h.includes('EMPRESA') || h.includes('DESTI')
      );
      const colArmadorIdx = headers.findIndex(h => 
        h.includes('ARMADOR') || h.includes('LINER') || h.includes('SHIP') || h.includes('DRAFT') || h.includes('AGENTE') || h.includes('AGENCY')
      );
      const colStatusIdx = headers.findIndex(h => 
        h.includes('STATUS') || h.includes('SITUA') || h.includes('EXECU') || h.includes('SITUACAO')
      );
      let colContainerIdx = headers.findIndex(h => 
        h.includes('CONT') || h.includes('EQUIP') || h.includes('CODI') || h.includes('COD.') || h.includes('G') || h.includes('NÚMERO') || h.includes('NUMERO') || h.includes('CNTR')
      );
      if (colContainerIdx === -1) {
        if (headers.length > 6) colContainerIdx = 6;
        else colContainerIdx = headers.length - 1;
      }

      const colRegionalIdx = headers.findIndex(h => 
        h.includes('REGIONAL') || h.includes('ORIGEM') || h.includes('BASE') || h.includes('FILIAL') || h.includes('CORREDOR') || h.includes('FONTE')
      );

      const colFornecedorIdx = headers.findIndex(h => 
        h.includes('FORNECEDOR') || h.includes('FORNEC') || h.includes('PROVIDER') || h.includes('SUPPLIER')
      );

      // Process rows starting after the header row
      let idCounter = 1;
      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const cells = rows[r];
        if (!cells || cells.length === 0) continue;

        // Ensure row has actual written items (ignore blank spacer lines)
        const hasContent = cells.some(c => c !== null && c !== undefined && String(c).trim() !== '');
        if (!hasContent) continue;

        // Secure value extractor helper
        const getCellStr = (idx: number): string => {
          if (idx !== -1 && idx < cells.length && cells[idx] !== undefined && cells[idx] !== null) {
            return String(cells[idx]).trim();
          }
          return '';
        };

         // 1. Armador (Index 16 - Coluna Q) with header fallback
         let armador = getCellStr(16);
         if (!armador && colArmadorIdx !== -1) {
           armador = getCellStr(colArmadorIdx);
         }
         if (!armador) armador = 'Armador Geral';

         // 2. Cliente/Pagador (Index 38 - Coluna AM) with header fallback
         let client = getCellStr(38);
         if (!client && colClientIdx !== -1) {
           client = getCellStr(colClientIdx);
         }
         if (!client) client = 'Cliente Geral';

         // If client is 'NP' (or 'np' etc.), utilize Supplier column ('Fornecedor')
         if (client.trim().toUpperCase() === 'NP') {
           let supplier = '';
           if (colFornecedorIdx !== -1) {
             supplier = getCellStr(colFornecedorIdx);
           }
           if (supplier && supplier.trim().toUpperCase() !== 'NP' && supplier.trim() !== '') {
             client = supplier;
           }
         }

        // 3. Fonte/Origem (Index 39 - Coluna AN) with header fallback
        let rawOrigem = getCellStr(39);
        if (!rawOrigem && colRegionalIdx !== -1) {
          rawOrigem = getCellStr(colRegionalIdx);
        }

        // Normalize regional to the correct state definitions
        let finalOrigem: ContainerRecord['origem'] = 'SUDOESTE'; // Default fallback
        if (rawOrigem) {
          const regCell = rawOrigem.toUpperCase();
          if (regCell.includes('SUDOESTE') || regCell.includes('SUDESTE') || regCell.includes('SP') || regCell.includes('RJ') || regCell.includes('MG')) {
            finalOrigem = 'SUDOESTE';
          } else if (regCell.includes('SUL') || regCell.includes('PR') || regCell.includes('SC') || regCell.includes('RS')) {
            finalOrigem = 'SUL';
          } else if (regCell.includes('NORDESTE') || regCell.includes('NE') || regCell.includes('PE') || regCell.includes('BA') || regCell.includes('AL') || regCell.includes('CE')) {
            finalOrigem = 'NORDESTE';
          } else if (regCell.includes('MONSTER') || regCell.includes('MONST')) {
            finalOrigem = 'MONSTER';
          } else if (regCell.includes('MASTER') || regCell.includes('MAST')) {
            finalOrigem = 'MASTER';
          } else {
            // General fuzzy fallbacks
            if (regCell.includes('SUL')) finalOrigem = 'SUL';
            else if (regCell.includes('NORDESTE')) finalOrigem = 'NORDESTE';
            else if (regCell.includes('MONST')) finalOrigem = 'MONSTER';
            else if (regCell.includes('MAST')) finalOrigem = 'MASTER';
          }
        }

        // 4. Status (Index 40 - Coluna AO) with header fallback
        let rawStatusObj = getCellStr(40);
        if (!rawStatusObj && colStatusIdx !== -1) {
          rawStatusObj = getCellStr(colStatusIdx);
        }

        const statusRaw = rawStatusObj.toUpperCase();
        let finalStatus: ContainerRecord['status'] = 'PROGRAMADO';
        if (statusRaw.includes('STATUS OPER') || statusRaw === 'OPER') {
          finalStatus = 'STATUS OPER';
        } else if (statusRaw.includes('EXEC') || statusRaw.includes('CONCLU') || statusRaw.includes('PAGO') || statusRaw.includes('SIM') || statusRaw.includes('REALIZADO') || statusRaw === 'OK') {
          finalStatus = 'EXECUTADO';
        } else if (statusRaw.includes('PROG')) {
          finalStatus = 'PROGRAMADO';
        } else if (statusRaw.includes('A PROGRAMAR') || statusRaw.includes('AGEND')) {
          finalStatus = 'A PROGRAMAR';
        }

        // 5. Container: Look for a container code in index 6 (Coluna G)
        let container = getCellStr(6);
        if (!container && colContainerIdx !== -1) {
          container = getCellStr(colContainerIdx);
        }
        if (!container || container === '') {
          // If blank, scan the current row to find a typical 11-digit container pattern as a safety net
          for (let col = 0; col < cells.length; col++) {
            const val = String(cells[col] || '').trim();
            if (val.length === 11 && /[A-Z]{4}\d{7}/.test(val)) {
              container = val;
              break;
            }
          }
        }
        if (!container) {
          container = 'A PROGRAMAR';
        }

        // 6. Parse Date with scanning fallback for the row
        let rawDateCell = colDateIdx !== -1 && colDateIdx < cells.length ? cells[colDateIdx] : '';
        
        if (rawDateCell === '' || rawDateCell === null || rawDateCell === undefined) {
          for (let col = 0; col < cells.length; col++) {
            const cellVal = cells[col];
            if (typeof cellVal === 'number' && cellVal >= 44000 && cellVal <= 48000) {
              rawDateCell = cellVal;
              break;
            } else if (typeof cellVal === 'string' && cellVal.trim() !== '') {
              const valStr = cellVal.trim();
              if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(valStr) || /^\d{4}-\d{1,2}-\d{1,2}/.test(valStr)) {
                rawDateCell = valStr;
                break;
              }
            }
          }
        }

        let rawDate = '';
        if (typeof rawDateCell === 'number') {
          const dateObj = new Date(Math.round((rawDateCell - 25569) * 86400 * 1000));
          const y = dateObj.getUTCFullYear();
          const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getUTCDate()).padStart(2, '0');
          rawDate = `${y}-${m}-${d}`;
        } else {
          rawDate = String(rawDateCell || '').trim();
        }

        let formattedDate = '';
        if (rawDate) {
          const regexBR = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
          const match = rawDate.match(regexBR);
          if (match) {
            let yearDigit = match[3];
            if (yearDigit.length === 2) {
              yearDigit = `20${yearDigit}`;
            }
            formattedDate = `${yearDigit}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          } else {
            const regexISO = /^(\d{4})-(\d{1,2})-(\d{1,2})/;
            const matchISO = rawDate.match(regexISO);
            if (matchISO) {
              formattedDate = `${matchISO[1]}-${matchISO[2].padStart(2, '0')}-${matchISO[3].padStart(2, '0')}`;
            }
          }
        }

        // Default based on target sheet if date is missing
        if (!formattedDate) {
          if (matchedTarget === 'JUN26') {
            formattedDate = '2026-06-15';
          } else if (matchedTarget === 'MAI26') {
            formattedDate = '2026-05-15';
          } else if (matchedTarget === 'ABR26') {
            formattedDate = '2026-04-15';
          } else {
            formattedDate = '2026-06-15';
          }
        }

        records.push({
          id: `${matchedTarget}-${idCounter++}`,
          origem: finalOrigem,
          data: formattedDate,
          cliente: client,
          armador: armador,
          container: container,
          status: finalStatus
        });
      }
    }
  }

  return { records, sheetsFound };
}

/**
 * Carrega dados de um Google Sheets publicado na web
 * Mapeamento exato de colunas:
 * - B (1): DATA — usado na lógica de status (executado vs programado)
 * - D (3): CLIENTE_CIF — cliente quando tipo de frete é CIF
 * - G (6): CONTAINER — validar se frete foi EXECUTADO
 * - J (9): TIPO_FRETE — CIF/FOB para definir pagador
 * - Q (16): ARMADOR — usado em gráfico e tabela "Armadores por Volume"
 * - V (21): CLIENTE_FOB — cliente quando tipo de frete é FOB
 * - AN (39): ORIGEM/BASE — usado em tabela e gráfico "Volume por Origem"
 * - AM (38): CLIENTE/PAGADOR — usado em tabela "Top Coletas" e filtro
 * - AO (40): STATUS — usado em todos os KPIs
 */
export async function loadFromGoogleSheets(sheetId: string): Promise<{ records: ContainerRecord[], sheetsFound: string[] }> {
  try {
    const sheetNames = ['JUN26', 'MAI26', 'ABR26'];
    const allRecords: ContainerRecord[] = [];
    const sheetsFound: string[] = [];
    
    // Mapeamento exato de colunas (0-indexed)
    const COLUMN_INDICES = {
      DATA: 1,              // B
      CLIENTE_CIF: 3,       // D
      CONTAINER: 6,         // G
      TIPO_FRETE: 9,        // J
      ARMADOR: 16,          // Q
      CLIENTE_FOB: 21,      // V
      CLIENTE_PAGADOR: 38,  // AM
      ORIGEM: 39,           // AN
      STATUS: 40            // AO
    };

    for (const sheetName of sheetNames) {
      try {
        // Mapear nome da aba para gid (ID interno do Google Sheets)
        let gid = 0;
        if (sheetName === 'MAI26') gid = 1;
        if (sheetName === 'ABR26') gid = 2;
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        
        const response = await fetch(csvUrl, { redirect: 'follow' });
        if (!response.ok) {
          console.warn(`Aba ${sheetName} não encontrada (gid=${gid})`);
          continue;
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        if (lines.length < 2) continue;
        
        // Parse CSV simples
        const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
        
        let idCounter = 1;
        for (let r = 1; r < rows.length; r++) {
          const cells = rows[r];
          if (!cells || cells.length === 0) continue;
          
          const hasContent = cells.some(c => c && c.trim() !== '');
          if (!hasContent) continue;
          
          const getCellStr = (idx: number): string => {
            if (idx < cells.length && cells[idx]) {
              return String(cells[idx]).trim();
            }
            return '';
          };
          
          // Extrair dados das colunas específicas
          const data = getCellStr(COLUMN_INDICES.DATA);
          const container = getCellStr(COLUMN_INDICES.CONTAINER) || `CNT-${idCounter}`;
          const tipoFrete = getCellStr(COLUMN_INDICES.TIPO_FRETE).toUpperCase();
          const armador = getCellStr(COLUMN_INDICES.ARMADOR) || 'Armador Geral';
          const rawOrigem = getCellStr(COLUMN_INDICES.ORIGEM) || '';
          const rawStatus = getCellStr(COLUMN_INDICES.STATUS) || 'PROGRAMADO';
          
          // Determinar cliente baseado em CIF/FOB
          let cliente = '';
          if (tipoFrete.includes('CIF')) {
            cliente = getCellStr(COLUMN_INDICES.CLIENTE_CIF);
          } else if (tipoFrete.includes('FOB')) {
            cliente = getCellStr(COLUMN_INDICES.CLIENTE_FOB);
          }
          // Fallback para coluna AM (CLIENTE_PAGADOR)
          if (!cliente) {
            cliente = getCellStr(COLUMN_INDICES.CLIENTE_PAGADOR);
          }
          if (!cliente) {
            cliente = 'Cliente Geral';
          }
          
          // Normalizar ORIGEM/BASE
          let finalOrigem: ContainerRecord['origem'] = 'SUDOESTE';
          if (rawOrigem) {
            const reg = rawOrigem.toUpperCase();
            if (reg.includes('SUL') || reg.includes('PR') || reg.includes('SC') || reg.includes('RS')) {
              finalOrigem = 'SUL';
            } else if (reg.includes('NORDESTE') || reg.includes('NE') || reg.includes('PE') || reg.includes('BA')) {
              finalOrigem = 'NORDESTE';
            } else if (reg.includes('MONSTER') || reg.includes('MONST')) {
              finalOrigem = 'MONSTER';
            } else if (reg.includes('MASTER')) {
              finalOrigem = 'MASTER';
            } else if (reg.includes('SUDOESTE') || reg.includes('SP') || reg.includes('MG')) {
              finalOrigem = 'SUDOESTE';
            }
          }
          
          // Normalizar STATUS
          let finalStatus: ContainerRecord['status'] = 'PROGRAMADO';
          if (rawStatus) {
            const st = rawStatus.toUpperCase();
            if (st.includes('EXECUT')) {
              finalStatus = 'EXECUTADO';
            } else if (st.includes('PROGRAMAD')) {
              finalStatus = 'PROGRAMADO';
            } else if (st.includes('STATUS OPER') || st.includes('STATUS_OPER')) {
              finalStatus = 'STATUS OPER';
            } else if (st.includes('PROGRAMAR') || st.includes('A_PROGRAMAR')) {
              finalStatus = 'A PROGRAMAR';
            }
          }
          
          // Formatar DATA (extrair apenas YYYY-MM-DD)
          let formattedDate = data;
          if (data && data.length >= 10) {
            const parts = data.split(/[\/-]/);
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                // DD/MM/YYYY ou DD-MM-YYYY
                formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else if (parts[0].length === 4) {
                // YYYY/MM/DD ou YYYY-MM-DD
                formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
            }
          }
          
          allRecords.push({
            id: `${sheetName}-${idCounter++}`,
            origem: finalOrigem,
            data: formattedDate,
            cliente: cliente,
            armador: armador,
            container: container,
            status: finalStatus
          });
        }
        
        sheetsFound.push(sheetName);
      } catch (err) {
        console.error(`Erro ao carregar aba ${sheetName}:`, err);
      }
    }
    
    if (allRecords.length === 0) {
      throw new Error('Nenhum dado foi encontrado nas abas JUN26, MAI26 ou ABR26 do Google Sheets.');
    }
    
    return { records: allRecords, sheetsFound };
  } catch (err) {
    console.error('Erro ao carregar Google Sheets:', err);
    throw new Error(`Falha ao carregar Google Sheets: ${err}`);
  }
}
