import React from "react";

const ControlsWidthContext = React.createContext<ControlsWidthContextValue | undefined>(
  undefined
);

type ControlsWidthContextValue = {
  controlsWidth: number
  isMediumControls: boolean
  isSmallControls: boolean
};

export const ControlsWidthContextProvider = ({ children, containerRef }: React.PropsWithChildren<{
  containerRef: React.MutableRefObject<null>
}>) => {
  // const containerRef = React.useRef(null);
  const [divWidth, setDivWidth] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);
  // const isLargeControls = divWidth > 500
  const isMediumControls = divWidth > 300 && divWidth < 450
  const isSmallControls = divWidth < 300
  // biome-ignore lint/correctness/useExhaustiveDependencies: <Observer instead of React to update>
  React.useEffect(() => {
    if (containerRef.current) {
      if (!isLoaded) {
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            setDivWidth(entry.contentRect.width);
          }
        });
        observer.observe(containerRef.current);
        setIsLoaded(true)
        return () => observer.disconnect(); // Clean up the observer
      }

    }
  }, []);

  return (
    <ControlsWidthContext.Provider
      value={{
        controlsWidth: divWidth,
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