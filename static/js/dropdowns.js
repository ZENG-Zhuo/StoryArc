// Define option lists
const storyArcOptions = [
    { value: 'rise-fall-rise', label: 'Rise-Fall-Rise' },
    { value: 'fall-rise', label: 'Fall-Rise' },
    { value: 'steady-rise', label: 'Steady Rise' },
    { value: 'steady-fall', label: 'Steady Fall' },
    { value: 'no-arc', label: 'No Arc' }
];

const endingCountOptions = [
    { value: 1, label: '1 Ending' },
    { value: 2, label: '2 Endings' },
    { value: 3, label: '3 Endings' },
    { value: 4, label: '4 Endings' }
];

// Populate dropdowns
function populateDropdown(id, options) {
    const dropdown = document.getElementById(id);
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        dropdown.appendChild(option);
    });
}




