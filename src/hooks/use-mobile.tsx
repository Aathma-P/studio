import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useOrientation() {
    const [orientation, setOrientation] = React.useState<'portrait' | 'landscape' | 'unknown'>('unknown');

    React.useEffect(() => {
        const getOrientation = () => {
            if (typeof window === 'undefined') return 'unknown';
            if (window.screen.orientation) {
                return window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape';
            }
            // Fallback for older browsers
            return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        }

        const handleOrientationChange = () => {
            setOrientation(getOrientation());
        }

        handleOrientationChange(); // Set initial orientation

        if(window.screen.orientation) {
            window.screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            window.addEventListener('resize', handleOrientationChange);
        }

        return () => {
            if(window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', handleOrientationChange);
            } else {
                window.removeEventListener('resize', handleOrientationChange);
            }
        }
    }, []);

    return orientation;
}
