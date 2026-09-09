import Select from 'react-select';

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  required,
  readOnly = false,
  isMulti = false,
  placeholder = "Select option",
}) {
  // Normalize value for react-select
  const getValue = () => {
    if (isMulti) {
      if (Array.isArray(value)) {
        return options.filter(opt => value.includes(opt.value));
      }
      return [];
    } else {
      if (value) {
        return options.find(opt => opt.value === value) || null;
      }
      return null;
    }
  };

  const handleChange = (selectedOption) => {
    if (isMulti) {
      const selectedValues = selectedOption 
        ? selectedOption.map(opt => opt.value) 
        : [];
      onChange(name, selectedValues);
    } else {
      onChange(name, selectedOption ? selectedOption.value : "");
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      backgroundColor: readOnly ? '#f3f4f6' : '#ffffff',
      cursor: readOnly ? 'not-allowed' : 'pointer',
      minHeight: '38px',
      fontSize: '0.875rem',
      '&:hover': {
        borderColor: readOnly ? '#d1d5db' : '#9ca3af',
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#e0e7ff'
        : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#111827',
      cursor: 'pointer',
      fontSize: '0.875rem',
      '&:active': {
        backgroundColor: '#3b82f6',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#dbeafe',
      borderRadius: '4px',
      padding: '2px 4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e40af',
      fontSize: '0.875rem',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1e40af',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#bfdbfe',
        color: '#1e3a8a',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Select
        name={name}
        options={options}
        value={getValue()}
        onChange={handleChange}
        isMulti={isMulti}
        isDisabled={readOnly}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="react-select"
        isClearable={!readOnly}
        isSearchable={true}
        noOptionsMessage={() => "No options available"}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  );
}