"use client";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { FaPlus } from "react-icons/fa";

// Dropdown Component
export const DropdownMenu = ({
  label,
  options,
  value,
  onChange,
  isDisabled = false,
  addRoute = null, // New prop for add button route
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const router = useRouter();

  // Filter options based on search input
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchTerm]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (!filteredOptions.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(
          (prevIndex) => (prevIndex + 1) % filteredOptions.length
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prevIndex) =>
            (prevIndex - 1 + filteredOptions.length) % filteredOptions.length
        );
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        selectOption(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const selectOption = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm(""); // Reset search term
  };

  return (
    <div className="relative mb-3" ref={dropdownRef}>
      <label
        className={`block text-gray-700 font-bold mb-1 text-sm ${
          isDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {label}
      </label>
      <div className="flex items-center">
        <div
          className={`border border-gray-300 rounded-md p-2 flex items-center justify-between cursor-pointer bg-white flex-grow text-sm `}
          onClick={() => {
            if (!isDisabled) {
              setIsOpen(!isOpen);
            }
          }}
        >
          <span>{value || `Select ${label}`}</span>
          <span className="text-gray-500">{isOpen ? "▲" : "▼"}</span>
        </div>
        {addRoute && (
          <div
            className="ml-2 p-1 hover:bg-gray-200 rounded-full cursor-pointer"
            title={`Add new ${label.toLowerCase()}`}
            onClick={() => router.push(addRoute)}
          >
            <FaPlus className="text-secondary hover:text-primary" />
          </div>
        )}
      </div>
      {isOpen && (
        <div className="absolute w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg z-10">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className="w-full p-2 border-b border-gray-300 focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="max-h-32 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  className={`p-1 cursor-pointer text-sm ${
                    index === highlightedIndex ? "bg-gray-200" : ""
                  }`}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option}
                </div>
              ))
            ) : (
              <p className="p-2 text-gray-500">No options found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
