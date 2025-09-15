import React from "react";

const ControlsWidthContext = React.createContext<ControlsWidthContextValue | undefined>(
  undefined
);

type ControlsWidthContextValue = {
  containerRef: React.MutableRefObject<null>
  setContainerWidth: (w: number) => void
  isMediumControls: boolean
  isSmallControls: boolean
};

export const ControlsWidthContextProvider = ({ children }: React.PropsWithChildren) => {
  const containerRef = React.useRef(null);
  const [divWidth, setDivWidth] = React.useState(0);
  const setContainerWidth = (w: number) => {
    setDivWidth(w)
  }
  // const isLargeControls = divWidth > 500
  const isMediumControls = divWidth > 300 && divWidth < 400
  const isSmallControls = divWidth < 300
  // biome-ignore lint/correctness/useExhaustiveDependencies: <Observer instead of React to update>
  React.useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect(); // Clean up the observer
    }
  }, []);

  return (
    <ControlsWidthContext.Provider
      value={{
        containerRef,
        setContainerWidth,
        isMediumControls,
        isSmallControls,
      }}
    >
      {children}
    </ControlsWidthContext.Provider>
  );
};

export const useControlsWidthContext = () => {
  const context = React.useContext(ControlsWidthContext);
  if (context === undefined) {
    throw new Error(
      "useControlsWidthContext must be used within a ControlsWidthContextProvider"
    );
  }
  return context;
};