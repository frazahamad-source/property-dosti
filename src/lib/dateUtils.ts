export type DateRange = { start: Date; end: Date };
export type ReportPeriod = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'previous_year' | 'custom';

// Returns absolute FY boundary for ANY given date. e.g. Oct 2024 -> Apr 2024 to Mar 2025
export const getFinancialYearDates = (date: Date = new Date()): DateRange => {
    const month = date.getMonth(); // 0-indexed (April is 3)
    const year = date.getFullYear();

    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;

    return {
        start: new Date(startYear, 3, 1), // April 1st
        end: new Date(endYear, 2, 31, 23, 59, 59, 999) // March 31st
    };
};

// Returns standard format e.g. "FY 2024-2025"
export const getFinancialYearString = (date: Date = new Date()): string => {
    const { start, end } = getFinancialYearDates(date);
    return `FY ${start.getFullYear()}-${end.getFullYear()}`;
};

// Return standard date range windows Based on the current specific period in the FY.
export const getReportPeriodDates = (period: ReportPeriod, customRange?: DateRange): DateRange => {
    const now = new Date();
    const currentFY = getFinancialYearDates(now);

    switch (period) {
        case 'monthly': {
            // Current calendar month
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
            };
        }
        case 'quarterly': {
            // Current FY quarter (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar)
            const m = now.getMonth();
            const y = now.getFullYear();
            let qStartMonth = 0; // Jan
            if (m >= 3 && m <= 5) qStartMonth = 3;      // Apr (Q1)
            else if (m >= 6 && m <= 8) qStartMonth = 6; // Jul (Q2)
            else if (m >= 9 && m <= 11) qStartMonth = 9;// Oct (Q3)
            // if m < 3, qStartMonth is 0 (Jan, Q4)

            return {
                start: new Date(y, qStartMonth, 1),
                end: new Date(y, qStartMonth + 3, 0, 23, 59, 59, 999)
            };
        }
        case 'half_yearly': {
            // H1: Apr - Sep, H2: Oct - Mar
            const startYear = currentFY.start.getFullYear();
            const isH1 = now.getTime() <= new Date(startYear, 8, 30, 23, 59, 59).getTime(); // Before Oct 1
            if (isH1) {
                return {
                    start: new Date(startYear, 3, 1),
                    end: new Date(startYear, 8, 30, 23, 59, 59, 999)
                };
            } else {
                return {
                    start: new Date(startYear, 9, 1),
                    end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999)
                };
            }
        }
        case 'yearly':
            return currentFY;
        case 'previous_year': {
            const startYear = currentFY.start.getFullYear() - 1;
            return {
                start: new Date(startYear, 3, 1),
                end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999)
            };
        }
        case 'custom':
            if (!customRange) throw new Error('Custom range required');
            // Ensure end date covers the full final day
            const extendedEnd = new Date(customRange.end);
            extendedEnd.setHours(23, 59, 59, 999);
            return {
                start: customRange.start,
                end: extendedEnd
            };
        default:
            return currentFY;
    }
};

export const formatDateForDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
