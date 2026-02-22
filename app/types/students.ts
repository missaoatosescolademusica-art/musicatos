export interface Student {
  id: string;
  fullName: string;
  nameFather: string | null;
  nameMother: string | null;
  phone: string;
  age?: number | null;
  address: string;
  instruments: string[];
  available: boolean;
  createdAt: string;
}

export type FetchStudentsDeps = {
  currentPage: number;
  searchQuery: string;
  phoneFilter: string;
  instrumentFilter: string;
  availableFilter: string;
  setLoading: (v: boolean) => void;
  setStudents: (arr: Student[]) => void;
  setTotalPages: (n: number) => void;
};
