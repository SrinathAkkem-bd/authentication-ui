import { ButtonProps } from "../../types";
import LoadingSpinner from "../Loading/LoadingSpinner";

const Button = ({ onClick, children, disabled, loading, ...props }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        bg-[#2a2a2a] hover:cursor-pointer hover:opacity-[0.8] 
        w-full outline-none py-2 px-4 rounded-lg text-gray-100
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${loading ? 'pointer-events-none' : ''}
      `}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

export default Button;