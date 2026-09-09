import Select from "react-select";

export default function InputCard({ fields, onChange, values, title,isSubTitle=false }) {
  return (
    <div className="flex flex-col">
      {title ? (
        <>
        {!isSubTitle &&(
          <hr className="my-2 border-gray-300 border-t" />
        )}
          <h1 className={`px-5 font-bold ${isSubTitle ? " text-gray-500 text-sm":""}`}>{title}</h1>
        </>
      ) : null}
      <div className="gap-4 grid grid-cols-2 md:grid-cols-4 p-4">
        {fields.map((field, index) => {
          if (field.type === "input") {
            return (
              <Input
                key={index}
                label={field.label}
                error={field?.error}
                type="text"
                name={field.name}
                value={values[field.name] || ""}
                onChange={onChange}
              />
            );
          } else if (field.type === "textarea") {
            return (
              <TeaxtArea
                key={index}
                label={field.label}
                name={field.name}
                error={field?.error}
                value={values[field.name] || ""}
                onChange={onChange}
              />
            );
          } else if (field.type === "select") {
            return (
              <CustomSelect
                key={index}
                label={field.label}
                name={field.name}
                value={values[field.name] || ""}
                error={field?.error}
                onChange={onChange}
                options={field.options || []}
              />
            );
          } else if (field.type === "upload") {
            return (
              <Upload
                key={index}
                label={field.label}
                name={field.name}
                error={field?.error}
                value={values[field.name] || ""}
                onChange={onChange}
              />
            );
          } else if (field.type === "wardSelect") {
            return (
              <WardSelect
                key={index}
                label={field.label}
                value={values[field.name] || ""}
                name={field.name}
                error={field?.error}
                wardList={field.options || []}
                onChange={onChange}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

const Input = ({ label, type, name, value, error,onChange }) => {
  return (
    <>
      <label className="block self-center col-span-1 mb-1 font-medium text-gray-700 text-sm">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.name, e.target.value)}
        className="self-center col-span-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
      {error &&(
        <span className="text-red-500">{error}</span>
      )}
    </>
  );
};

const TeaxtArea = ({ label, name, value, error,onChange }) => {
  return (
    <>
      <label className="block self-center col-span-1 mb-1 font-medium text-gray-700 text-sm">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.name, e.target.value)}
        className="self-center col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
      {error &&(
        <span className="text-red-500">{error}</span>
      )}
    </>
  );
};

const CustomSelect = ({ label, name, value, onChange, error,options }) => {
  return (
    <>
      <label className="block self-center col-span-1 mb-1 font-medium text-gray-700 text-sm">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.name, e.target.value)}
        className="self-center col-span-1 bg-white px-3 py-2 border border-gray-300 *:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error &&(
        <span className="text-red-500">{error}</span>
      )}
    </>
  );
};

const WardSelect = ({ label, name, value, onChange,error, wardList }) => {
  return (
    <>
      <label className="block self-center col-span-1 mb-1 font-medium text-gray-700 text-sm">
        {label}
      </label>
      <Select
        // isMulti
        options={wardList.map((w) => ({
          value: w.id,
          label: w.wardNo,
        }))}
        value={wardList
          .filter((w) => value === w.id)
          .map((w) => ({ value: w.id, label: w.wardNo }))}
        onChange={(selectedOptions) => {
          onChange(name, selectedOptions.value);
        }}
        placeholder="Select Ward(s)..."
        className="text-sm"
      />
      {error &&(
        <span className="text-red-500">{error}</span>
      )}
    </>
  );
};

const Upload = ({ label, name, error,onChange }) => {
  return (
    <>
      <label className="block self-center col-span-1 mb-1 font-medium text-gray-700 text-sm">
        {label}
      </label>
      <input
        type="file"
        name={name}
        onChange={(e) => onChange(e.target.name, e.target.files[0])}
        className="self-center col-span-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
      {error &&(
        <span className="text-red-500">{error}</span>
      )}
    </>
  );
};
