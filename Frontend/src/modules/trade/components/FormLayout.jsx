import FieldRenderer from "./FieldRenderer";

export default function FormLayout({
  fields,
  data,
  onChange,
  isEditable = true,
  columns = 3,
  ...rest
}) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {fields.map((field) => (
        <FieldRenderer
          key={field.name}

          field={field}
          data={data}
          onChange={onChange}

          isEditable={isEditable && field.disabled !== true}

          disabled={field.disabled === true}
          {...rest}
        />
      ))}
    </div>
  );
}
