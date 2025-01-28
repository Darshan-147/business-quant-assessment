<?php
/*
Plugin Name: Custom Screener Filter
Description: A custom filter plugin to display and filter screener data.
Version: 1.2
Author: Darshan Soni
*/

if (!defined('ABSPATH')) {
    exit;
}

// Enable error logging
ini_set('log_errors', 1);
ini_set('error_log', plugin_dir_path(__FILE__) . 'error_log.txt');

// Function to log errors
function custom_screener_log_error($message) {
    error_log("[Custom Screener Filter] " . $message);
}

function custom_screener_enqueue_scripts()
{
    if (!function_exists('wp_enqueue_script')) {
        custom_screener_log_error("Error: wp_enqueue_script function not found.");
        return;
    }

    // Enqueue Select2 and DataTables libraries
    wp_enqueue_script('jquery');
    wp_enqueue_style('select2-css', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.1.0/css/select2.min.css');
    wp_enqueue_script('select2-js', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.1.0/js/select2.min.js', ['jquery'], null, true);
    wp_enqueue_style('datatables-css', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
    wp_enqueue_script('datatables-js', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js', ['jquery'], null, true);

    // Custom CSS and JS
    wp_enqueue_script('custom-screener-js', plugin_dir_url(__FILE__) . 'scripts.js', ['jquery', 'select2-js', 'datatables-js'], null, true);
    wp_enqueue_style('custom-screener-css', plugin_dir_url(__FILE__) . 'styles.css');

    // Pass data from server to JavaScript
    $screener_data = custom_screener_get_data();
    if (isset($screener_data['error'])) {
        custom_screener_log_error("Error loading screener data: " . $screener_data['error']);
    }
    
    wp_localize_script('custom-screener-js', 'screenerData', $screener_data);
}
add_action('wp_enqueue_scripts', 'custom_screener_enqueue_scripts');

// Function to read screener data from CSV with error handling
function custom_screener_get_data()
{
    $list_file = plugin_dir_path(__FILE__) . 'screener_list.csv';
    $data_file = plugin_dir_path(__FILE__) . 'screener_data.csv';

    // Check if files exist
    if (!file_exists($list_file) || !file_exists($data_file)) {
        custom_screener_log_error("CSV files not found: $list_file or $data_file");
        return ['error' => 'CSV files not found'];
    }

    // Read screener list (for dropdown options)
    $screener_list = @array_map('str_getcsv', file($list_file));
    if (!$screener_list) {
        custom_screener_log_error("Error reading screener_list.csv");
        return ['error' => 'Error reading screener_list.csv'];
    }

    $headers = array_shift($screener_list); // Remove the header row

    // Read screener data (for table)
    $screener_data = @array_map('str_getcsv', file($data_file));
    if (!$screener_data) {
        custom_screener_log_error("Error reading screener_data.csv");
        return ['error' => 'Error reading screener_data.csv'];
    }

    $data_headers = array_shift($screener_data); // Remove the header row

    return [
        'list' => $screener_list,
        'data' => $screener_data
    ];
}

// Shortcode to render the screener UI
function custom_screener_shortcode()
{
    ob_start(); ?>
    <div id="custom-screener">
        <div class="filters">
            <select class="metric-select" id="metric-1">
                <option value="">Select Metric</option>
            </select>
            <select class="comparison-select" id="comparison-1">
                <option value="greater">Greater than</option>
                <option value="greater_equal">Greater than or equal to</option>
                <option value="less">Less than</option>
                <option value="less_equal">Less than or equal to</option>
                <option value="equal">Equal to</option>
            </select>
            <input type="text" id="value-1" placeholder="Enter value">
            <select class="unit-select" id="unit-1">
                <option value="">Select Units</option>
                <option value="percentage">%</option>
                <option value="usd">USD</option>
                <option value="million">Million</option>
                <option value="billion">Billion</option>
            </select>
        </div>

        <button id="add-filter">+</button>
        <table id="screener-table" class="display">
            <thead>
                <tr>
                    <th>Ticker</th>
                    <th>Company</th>
                    <th>Sector</th>
                    <th>Industry</th>
                    <th>Market Cap</th>
                    <th>52w High</th>
                </tr>
            </thead>
            <tbody>
                <!-- Data will be populated via JavaScript -->
            </tbody>
        </table>
    </div>
<?php return ob_get_clean();
}
add_shortcode('screener-dropdown', 'custom_screener_shortcode');
?>
