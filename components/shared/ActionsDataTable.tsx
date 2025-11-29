import { Student } from "@/app/dashboard/helper/handles";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit2, Trash2 } from "lucide-react";
export const ActionsDataTable = ({
  viewStudent,
  editStudent,
  deleteStudent,
  s
}: {
  viewStudent: (student: Student) => void
  editStudent: (student: Student) => void
  deleteStudent: (id: string) => void,
  s:Student
}) => {
  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-slate-700 border-slate-600"
        >
          <DropdownMenuItem
            onClick={() => viewStudent(s)}
            className="text-slate-200 cursor-pointer hover:bg-slate-600"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editStudent(s)}
            className="text-slate-200 cursor-pointer hover:bg-slate-600"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => deleteStudent(s.id || "")}
            className="text-red-400 cursor-pointer hover:bg-slate-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
