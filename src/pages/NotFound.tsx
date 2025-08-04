import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="form-container">
      <div className="text-center space-y-6">
        <h1 className="text-display text-primary">404</h1>
        <p className="text-subheading text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="btn-primary inline-block px-6 py-3 rounded-md text-decoration-none hover-scale">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
