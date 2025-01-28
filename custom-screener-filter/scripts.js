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

            if (metric && comparison && value && unit) {
                filters.push({ metric, comparison, value, unit });
            }
        });

        table.clear().draw();
        let filteredData = screenerData.data.filter(row => {
            return filters.every(filter => {
                let index = screenerData.list.findIndex(item => item[0] === filter.metric);
                let cellValue = parseFloat(row[index]); 
                let filterValue = parseFloat(filter.value);
                if (isNaN(cellValue) || isNaN(filterValue)) return true;

                switch (filter.unit) {
                    case "%":
                        filterValue = filterValue / 100; 
                        break;
                    case "M":
                        filterValue = filterValue * 1e6; 
                        break;
                    case "B":
                        filterValue = filterValue * 1e9; 
                        break;
                }

                switch (filter.comparison) {
                    case "greater":
                        return cellValue > filterValue;
                    case "greater_equal":
                        return cellValue >= filterValue;
                    case "less":
                        return cellValue < filterValue;
                    case "less_equal":
                        return cellValue <= filterValue;
                    case "equal":
                        return cellValue === filterValue;
                    default:
                        return true;
                }
            });
        });

        table.rows.add(filteredData).draw();
    }

    // Apply filters when value changes
    $(document).on('change', '.filter-row select, .filter-row input', function () {
        applyFilters();
    });

    // Initialize with one filter row
    addFilterRow();
});
