// src/features/hooks/useTooltip.js
import { useState, useCallback, useRef } from 'react';

const useTooltip = () => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipData, setTooltipData] = useState(null);
  const tooltipTimeoutRef = useRef(null);
  
  const showTooltip = useCallback((data, event) => {
    clearTimeout(tooltipTimeoutRef.current);
    
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Position the tooltip to the right of the element
    // with a small offset (10px) for spacing
    setTooltipPosition({
      top: rect.top + window.scrollY,
      left: rect.right + window.scrollX + 10
    });
    
    setTooltipData(data);
    setIsTooltipVisible(true);
  }, []);
  
  const hideTooltip = useCallback(() => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
    }, 200);
  }, []);
  
  const cancelHideTooltip = useCallback(() => {
    clearTimeout(tooltipTimeoutRef.current);
  }, []);

  return {
    isTooltipVisible,
    tooltipPosition,
    tooltipData,
    showTooltip,
    hideTooltip,
    cancelHideTooltip
  };
};

export default useTooltip;