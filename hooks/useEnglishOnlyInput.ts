import React, { useState, useCallback, useEffect } from 'react';

// A more robust version that handles external updates:
export const useEnglishOnlyInputV2 = (initialValue: string = ''): [string, (newValue: string) => void, boolean] => {
    const [value, setValue] = useState(initialValue);
    const [warning, setWarning] = useState(false);

    // Effect to synchronize with initialValue if it changes
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    
    const setValueWrapper = (newValue: string) => {
        const nonAsciiRegex = /[^\u0000-\u007F]+/;
        if (nonAsciiRegex.test(newValue)) {
            setWarning(true);
            // Don't update state if invalid characters are found
        } else {
            setWarning(false);
            setValue(newValue);
        }
    }

    return [value, setValueWrapper, warning];
};
