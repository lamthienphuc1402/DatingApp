import { useQuery } from "@tanstack/react-query";

const fetchData = async (
  section: string,
  endpoint: string,
  signal: AbortSignal
) => {
  const data = await fetch(
    `${import.meta.env.VITE_LOCAL_API_URL}/${section}/${endpoint}`,
    {
      signal,
    }
  );

  return await data.json();
};

export function useFetchData<T>(
  queryKey: string,
  section: string,
  endpoint: string
) {
  const { isError, isLoading, data } = useQuery<T>({
    queryFn: async (context: any) => {
      const result = await fetchData(section, endpoint, context.signal);

      return result.data;
    },
    queryKey: [queryKey],
  });
  return { data, isLoading, isError };
}
