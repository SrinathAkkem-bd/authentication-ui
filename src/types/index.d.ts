import { ButtonHTMLAttributes, ReactNode, ChangeEvent } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  loading?: boolean;
}

type InputProps = {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  name?: string;
  value?: any;
};