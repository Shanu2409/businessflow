import { useState, useEffect, useRef } from "react";

const BankDropdown = ({ bankList, allowedBanks, setAllowedBanks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleBank = (bank) => {
    if (allowedBanks.includes(bank)) {
      setAllowedBanks(allowedBanks.filter((b) => b !== bank));
    } else {
      setAllowedBanks([...allowedBanks, bank]);
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block w-64">
      <button
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          setIsOpen(!isOpen);
        }}
        className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-left shadow-sm focus:outline-none"
      >
        {allowedBanks.length > 0
          ? `${allowedBanks.length} Bank(s) Selected`
          : "Select Banks"}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            {bankList?.map((bank) => (
              <label
                key={bank}
                className="flex items-center space-x-2 mb-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={allowedBanks.includes(bank)}
                  onChange={() => toggleBank(bank)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{bank}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDropdown;
