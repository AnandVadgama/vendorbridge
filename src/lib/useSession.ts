import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  });

export function useSession() {
  const { data, error, isLoading } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    data: data ? { user: data } : null,
    status: isLoading ? 'loading' : data ? 'authenticated' : 'unauthenticated',
    error,
    isLoading,
  };
}
