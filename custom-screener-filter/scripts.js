jQuery(document).ready(function ($) {
    if (typeof screenerData === 'undefined' || screenerData.error) {
        console.error('Screener data not found or an error occurred:', screenerData.error);
        return;
    }

    let filterCount = 0; 

    // Function to create a new filter row
    function addFilterRow() {
        filterCount++;
        const filterId = `filter-${filterCount}`;
        $('.filters').append(`
            <div class="filter-row" id="${filterId}">
                <select class="metric-select">
                    <option value="">Select Metric</option>
                    ${screenerData.list.map(item => `<option value="${item[0]}">${item[0]}</option>`).join('')}
                </select>
                <select class="comparison-select">
                    <option value="greater">Greater than</option>
                    <option value="greater_equal">Greater than or equal to</option>
                    <option value="less">Less than</option>
                    <option value="less_equal">Less than or equal to</option>
                    <option value="equal">Equal to</option>
                </select>
                <input type="text" class="value-input" placeholder="Enter value">
                <select class="unit-select">
                    <option value="">Select Unit</option>
                    <option value="%">%</option>
                    <option value="$">$</option>
                    <option value="M">Million</option>
                    <option value="B">Billion</option>
                </select>
                <button class="delete-filter" data-id="${filterId}">×</button>
            </div>
        `);

        // Reinitialize Select2 for new elements
        $('.metric-select, .unit-select').select2({ placeholder: 'Select an option', allowClear: true });
    }

    // Handle "Add Filter" button click
    $('#add-filter').on('click', function () {
        addFilterRow();
    });

    // Handle filter deletion
    $(document).on('click', '.delete-filter', function () {
        const filterId = $(this).data('id');
        $(`#${filterId}`).remove();
    });

    // Initialize Select2 for first filter
    $('.metric-select, .unit-select').select2({ placeholder: 'Select an option', allowClear: true });

    // Initialize DataTable
    const table = $('#screener-table').DataTable({
        data: screenerData.data,
        columns: [
            { title: 'Ticker' },
            { title: 'Company' },
            { title: 'Sector' },
            { title: 'Industry' },
            { title: 'Market Cap' },
            { title: '52w High' },
        ],
        pageLength: 10,
    });

    // Apply filters
    function applyFilters() {
        let filters = [];
        $('.filter-row').each(function () {
            const metric = $(this).find('.metric-select').val();
            const comparison = $(this).find('.comparison-select').val();
            const value = $(this).find('.value-input').val();
            const unit = $(this).find('.unit-select').val();
    
            if (metric && comparison && value) {
                filters.push({ metric, comparison, value, unit });
            }
        });
    
        // Clear table before adding filtered data
        table.clear();
    
        let filteredData = screenerData.data.filter(row => {
            return filters.every(filter => {
                let metricIndex = screenerData.list.findIndex(item => item[0] === filter.metric);
                if (metricIndex === -1) return true; // Skip if metric is not found
    
                let cellValue = parseFloat(row[metricIndex]); // Get value from correct column
                let filterValue = parseFloat(filter.value);
    
                if (isNaN(cellValue) || isNaN(filterValue)) return false; // Ignore invalid values
    
                // Convert units
                if (filter.unit === "%") filterValue /= 100;
                if (filter.unit === "M") filterValue *= 1e6;
                if (filter.unit === "B") filterValue *= 1e9;
    
                // Apply comparison
                switch (filter.comparison) {
                    case "greater": return cellValue > filterValue;
                    case "greater_equal": return cellValue >= filterValue;
                    case "less": return cellValue < filterValue;
                    case "less_equal": return cellValue <= filterValue;
                    case "equal": return cellValue === filterValue;
                    default: return true;
                }
            });
        });
    
        // **Ensure filtered data matches the column format**
        filteredData = filteredData.map(row => [
            row[0], // Ticker
            row[1], // Company
            row[2], // Sector
            row[3], // Industry
            row[4], // Market Cap
            row[5], // 52w High
        ]);
    
        console.log(row);
        console.log(filteredData);
        // Add and render filtered data
        table.rows.add(filteredData).draw();
    }
    

    // Apply filters when value changes
    $(document).on('change', '.filter-row select, .filter-row input', function () {
        applyFilters();
    });

    // Initialize with one filter row
    addFilterRow();
});
