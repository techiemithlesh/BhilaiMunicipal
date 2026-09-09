import React from 'react'

function PreviewFormData({ title, formFields }) {
  return (
    <div className="flex flex-col gap-4 text-gray-700 text-lg">
      <div className="flex flex-col gap-4 bg-white shadow p-4 border-t-4 border-blue-500 rounded-lg">
        
        {title && (
          <h3 className="font-semibold text-gray-700 text-xl">{title}</h3>
        )}

        <div className="gap-x-8 gap-y-4 grid grid-cols-1 md:grid-cols-2">
          {formFields?.map((item, index) => (
            <div key={index} className={`flex flex-col col-span-${item.colSpan}`}>
              
              <label className="mb-1 font-medium text-gray-500 text-sm">
                {item?.label}
              </label>

              {item?.value && (
                Array.isArray(item.value)
                  ? item.value.map((ele, i) => {
                    console.log("ele",ele);
                    return(
                      <div key={i} className="text-sm bg-slate-300 p-1 px-2 rounded-md text-black mb-1">
                        {ele.value || ele} 
                      </div>
                    )
                  })
                  : (
                    <p className="text-gray-900 text-sm">{item?.value}</p>
                  )
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default PreviewFormData
