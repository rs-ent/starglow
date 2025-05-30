"use client";

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface OptimisticUpdateOptions<T, U> {
  queryKey: unknown[];
  mutationFn: (variables: U) => Promise<T>;
  optimisticUpdate: (oldData: T | undefined, variables: U) => T;
  onSuccess?: (data: T, variables: U) => void;
  onError?: (error: Error, variables: U, rollback: () => void) => void;
}

export function useOptimisticUpdate<T, U>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  onSuccess,
  onError,
}: OptimisticUpdateOptions<T, U>) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });
      
      // 이전 데이터 스냅샷 저장
      const previousData = queryClient.getQueryData<T>(queryKey);
      
      // 낙관적 업데이트 적용
      queryClient.setQueryData<T>(queryKey, (old) => 
        optimisticUpdate(old, variables)
      );
      
      setIsOptimistic(true);
      
      // 롤백 함수 반환
      return { previousData };
    },
    onSuccess: (data, variables, context) => {
      // 실제 데이터로 업데이트
      queryClient.setQueryData(queryKey, data);
      setIsOptimistic(false);
      
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error, variables, context) => {
      // 오류 발생 시 이전 데이터로 롤백
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      setIsOptimistic(false);
      
      if (onError) {
        onError(error as Error, variables, () => {
          if (context?.previousData) {
            queryClient.setQueryData(queryKey, context.previousData);
          }
        });
      }
    },
    onSettled: () => {
      // 쿼리 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const execute = useCallback((variables: U) => {
    return mutation.mutate(variables);
  }, [mutation]);

  return {
    execute,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    isOptimistic,
    error: mutation.error,
    reset: mutation.reset,
  };
}