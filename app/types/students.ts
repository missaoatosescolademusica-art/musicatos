export interface Student {
  id: string;
  fullName: string;
  nameFather: string;
  nameMother: string;
  phone: string;
  address: string;
  instruments: string[];
  available: boolean;
  createdAt: string;
}

export type FetchStudentsDeps = {
  currentPage: number;
  searchQuery: string;
  setLoading: (v: boolean) => void;
  setStudents: (arr: Student[]) => void;
  setTotalPages: (n: number) => void;
};
