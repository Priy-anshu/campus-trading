import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorCardProps {
  message?: string;
}

const ErrorCard = ({ message = "Failed to load data. Please try again." }: ErrorCardProps) => {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex items-center gap-3 p-6">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
};

export default ErrorCard;
