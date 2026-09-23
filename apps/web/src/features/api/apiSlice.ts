import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../../app/store';
import {
  User,
  EmployeeListItem,
  EmployeeDetail,
  PaginationMeta,
  FilterFacets,
  EmployeeFilterParams,
} from '../../types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Employees', 'Employee', 'Facets', 'Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<
      { token: string; user: User },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { success: boolean; data: { token: string; user: User } }) =>
        response.data,
      invalidatesTags: ['Auth', 'Employees'],
    }),

    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      providesTags: ['Auth'],
    }),

    getEmployees: builder.query<
      { employees: EmployeeListItem[]; pagination: PaginationMeta },
      EmployeeFilterParams
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.search) queryParams.set('search', params.search);
        if (params.country) queryParams.set('country', params.country);
        if (params.department) queryParams.set('department', params.department);
        if (params.jobTitle) queryParams.set('jobTitle', params.jobTitle);
        if (params.status) queryParams.set('status', params.status);
        if (params.currency) queryParams.set('currency', params.currency);
        if (params.minSalary !== undefined) queryParams.set('minSalary', params.minSalary.toString());
        if (params.maxSalary !== undefined) queryParams.set('maxSalary', params.maxSalary.toString());
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        return `/employees?${queryParams.toString()}`;
      },
      transformResponse: (response: {
        success: boolean;
        data: EmployeeListItem[];
        pagination: PaginationMeta;
      }) => ({
        employees: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.employees.map(({ id }) => ({ type: 'Employees' as const, id })),
              { type: 'Employees', id: 'LIST' },
            ]
          : [{ type: 'Employees', id: 'LIST' }],
    }),

    getEmployeeById: builder.query<EmployeeDetail, string>({
      query: (id) => `/employees/${id}`,
      transformResponse: (response: { success: boolean; data: EmployeeDetail }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),

    getFacets: builder.query<FilterFacets, void>({
      query: () => '/employees/facets',
      transformResponse: (response: { success: boolean; data: FilterFacets }) => response.data,
      providesTags: ['Facets'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useGetFacetsQuery,
} = apiSlice;
