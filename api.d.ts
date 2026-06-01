import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ActionResult, CaptureCandidate, CaptureSummary, ConfirmNodeInput, ConflictDetectInput, ConflictResult, DismissNodeInput, Doctor, DoctorContext, DoctorInput, EventLog, ExtractInput, HealthStatus, KnowledgeNode, KnowledgeNodeUpdate, ListEventsParams, ListKnowledgeNodesParams, MergeNodeInput, OpenAIHealth, Patient, PatientContext, PatientInput, SemanticSearchBody, SemanticSearchResult, UndoNodeInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCheckOpenAIHealthUrl: () => string;
/**
 * @summary Check if OpenAI API key is configured and usable
 */
export declare const checkOpenAIHealth: (options?: RequestInit) => Promise<OpenAIHealth>;
export declare const getCheckOpenAIHealthQueryKey: () => readonly ["/api/healthz/openai"];
export declare const getCheckOpenAIHealthQueryOptions: <TData = Awaited<ReturnType<typeof checkOpenAIHealth>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof checkOpenAIHealth>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof checkOpenAIHealth>>, TError, TData> & {
    queryKey: QueryKey;
};
export type CheckOpenAIHealthQueryResult = NonNullable<Awaited<ReturnType<typeof checkOpenAIHealth>>>;
export type CheckOpenAIHealthQueryError = ErrorType<unknown>;
/**
 * @summary Check if OpenAI API key is configured and usable
 */
export declare function useCheckOpenAIHealth<TData = Awaited<ReturnType<typeof checkOpenAIHealth>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof checkOpenAIHealth>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListPatientsUrl: () => string;
/**
 * @summary List all patients
 */
export declare const listPatients: (options?: RequestInit) => Promise<Patient[]>;
export declare const getListPatientsQueryKey: () => readonly ["/api/patients"];
export declare const getListPatientsQueryOptions: <TData = Awaited<ReturnType<typeof listPatients>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPatients>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPatients>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPatientsQueryResult = NonNullable<Awaited<ReturnType<typeof listPatients>>>;
export type ListPatientsQueryError = ErrorType<unknown>;
/**
 * @summary List all patients
 */
export declare function useListPatients<TData = Awaited<ReturnType<typeof listPatients>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPatients>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePatientUrl: () => string;
/**
 * @summary Create a new patient
 */
export declare const createPatient: (patientInput: PatientInput, options?: RequestInit) => Promise<Patient>;
export declare const getCreatePatientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPatient>>, TError, {
        data: BodyType<PatientInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPatient>>, TError, {
    data: BodyType<PatientInput>;
}, TContext>;
export type CreatePatientMutationResult = NonNullable<Awaited<ReturnType<typeof createPatient>>>;
export type CreatePatientMutationBody = BodyType<PatientInput>;
export type CreatePatientMutationError = ErrorType<unknown>;
/**
* @summary Create a new patient
*/
export declare const useCreatePatient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPatient>>, TError, {
        data: BodyType<PatientInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPatient>>, TError, {
    data: BodyType<PatientInput>;
}, TContext>;
export declare const getGetPatientContextUrl: (patientId: number) => string;
/**
 * @summary Get patient context nodes
 */
export declare const getPatientContext: (patientId: number, options?: RequestInit) => Promise<PatientContext>;
export declare const getGetPatientContextQueryKey: (patientId: number) => readonly [`/api/patients/${number}/context`];
export declare const getGetPatientContextQueryOptions: <TData = Awaited<ReturnType<typeof getPatientContext>>, TError = ErrorType<unknown>>(patientId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPatientContext>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPatientContext>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPatientContextQueryResult = NonNullable<Awaited<ReturnType<typeof getPatientContext>>>;
export type GetPatientContextQueryError = ErrorType<unknown>;
/**
 * @summary Get patient context nodes
 */
export declare function useGetPatientContext<TData = Awaited<ReturnType<typeof getPatientContext>>, TError = ErrorType<unknown>>(patientId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPatientContext>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListDoctorsUrl: () => string;
/**
 * @summary List all doctors
 */
export declare const listDoctors: (options?: RequestInit) => Promise<Doctor[]>;
export declare const getListDoctorsQueryKey: () => readonly ["/api/doctors"];
export declare const getListDoctorsQueryOptions: <TData = Awaited<ReturnType<typeof listDoctors>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDoctors>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDoctors>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDoctorsQueryResult = NonNullable<Awaited<ReturnType<typeof listDoctors>>>;
export type ListDoctorsQueryError = ErrorType<unknown>;
/**
 * @summary List all doctors
 */
export declare function useListDoctors<TData = Awaited<ReturnType<typeof listDoctors>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDoctors>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateDoctorUrl: () => string;
/**
 * @summary Create a new doctor
 */
export declare const createDoctor: (doctorInput: DoctorInput, options?: RequestInit) => Promise<Doctor>;
export declare const getCreateDoctorMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDoctor>>, TError, {
        data: BodyType<DoctorInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDoctor>>, TError, {
    data: BodyType<DoctorInput>;
}, TContext>;
export type CreateDoctorMutationResult = NonNullable<Awaited<ReturnType<typeof createDoctor>>>;
export type CreateDoctorMutationBody = BodyType<DoctorInput>;
export type CreateDoctorMutationError = ErrorType<unknown>;
/**
* @summary Create a new doctor
*/
export declare const useCreateDoctor: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDoctor>>, TError, {
        data: BodyType<DoctorInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDoctor>>, TError, {
    data: BodyType<DoctorInput>;
}, TContext>;
export declare const getGetDoctorContextUrl: (doctorId: number) => string;
/**
 * @summary Get doctor context — their nodes and stats
 */
export declare const getDoctorContext: (doctorId: number, options?: RequestInit) => Promise<DoctorContext>;
export declare const getGetDoctorContextQueryKey: (doctorId: number) => readonly [`/api/doctors/${number}/context`];
export declare const getGetDoctorContextQueryOptions: <TData = Awaited<ReturnType<typeof getDoctorContext>>, TError = ErrorType<void>>(doctorId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDoctorContext>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDoctorContext>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDoctorContextQueryResult = NonNullable<Awaited<ReturnType<typeof getDoctorContext>>>;
export type GetDoctorContextQueryError = ErrorType<void>;
/**
 * @summary Get doctor context — their nodes and stats
 */
export declare function useGetDoctorContext<TData = Awaited<ReturnType<typeof getDoctorContext>>, TError = ErrorType<void>>(doctorId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDoctorContext>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExtractKnowledgeUrl: () => string;
/**
 * @summary Extract knowledge nodes from transcript using LLM
 */
export declare const extractKnowledge: (extractInput: ExtractInput, options?: RequestInit) => Promise<CaptureCandidate[]>;
export declare const getExtractKnowledgeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof extractKnowledge>>, TError, {
        data: BodyType<ExtractInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof extractKnowledge>>, TError, {
    data: BodyType<ExtractInput>;
}, TContext>;
export type ExtractKnowledgeMutationResult = NonNullable<Awaited<ReturnType<typeof extractKnowledge>>>;
export type ExtractKnowledgeMutationBody = BodyType<ExtractInput>;
export type ExtractKnowledgeMutationError = ErrorType<unknown>;
/**
* @summary Extract knowledge nodes from transcript using LLM
*/
export declare const useExtractKnowledge: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof extractKnowledge>>, TError, {
        data: BodyType<ExtractInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof extractKnowledge>>, TError, {
    data: BodyType<ExtractInput>;
}, TContext>;
export declare const getDetectConflictsUrl: () => string;
/**
 * @summary Generate embedding and detect conflicts via cosine similarity search
 */
export declare const detectConflicts: (conflictDetectInput: ConflictDetectInput, options?: RequestInit) => Promise<ConflictResult>;
export declare const getDetectConflictsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof detectConflicts>>, TError, {
        data: BodyType<ConflictDetectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof detectConflicts>>, TError, {
    data: BodyType<ConflictDetectInput>;
}, TContext>;
export type DetectConflictsMutationResult = NonNullable<Awaited<ReturnType<typeof detectConflicts>>>;
export type DetectConflictsMutationBody = BodyType<ConflictDetectInput>;
export type DetectConflictsMutationError = ErrorType<unknown>;
/**
* @summary Generate embedding and detect conflicts via cosine similarity search
*/
export declare const useDetectConflicts: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof detectConflicts>>, TError, {
        data: BodyType<ConflictDetectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof detectConflicts>>, TError, {
    data: BodyType<ConflictDetectInput>;
}, TContext>;
export declare const getConfirmNodeUrl: () => string;
/**
 * @summary Confirm and create a knowledge node
 */
export declare const confirmNode: (confirmNodeInput: ConfirmNodeInput, options?: RequestInit) => Promise<KnowledgeNode>;
export declare const getConfirmNodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmNode>>, TError, {
        data: BodyType<ConfirmNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof confirmNode>>, TError, {
    data: BodyType<ConfirmNodeInput>;
}, TContext>;
export type ConfirmNodeMutationResult = NonNullable<Awaited<ReturnType<typeof confirmNode>>>;
export type ConfirmNodeMutationBody = BodyType<ConfirmNodeInput>;
export type ConfirmNodeMutationError = ErrorType<unknown>;
/**
* @summary Confirm and create a knowledge node
*/
export declare const useConfirmNode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmNode>>, TError, {
        data: BodyType<ConfirmNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof confirmNode>>, TError, {
    data: BodyType<ConfirmNodeInput>;
}, TContext>;
export declare const getDismissNodeUrl: () => string;
/**
 * @summary Dismiss a capture candidate
 */
export declare const dismissNode: (dismissNodeInput: DismissNodeInput, options?: RequestInit) => Promise<ActionResult>;
export declare const getDismissNodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof dismissNode>>, TError, {
        data: BodyType<DismissNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof dismissNode>>, TError, {
    data: BodyType<DismissNodeInput>;
}, TContext>;
export type DismissNodeMutationResult = NonNullable<Awaited<ReturnType<typeof dismissNode>>>;
export type DismissNodeMutationBody = BodyType<DismissNodeInput>;
export type DismissNodeMutationError = ErrorType<unknown>;
/**
* @summary Dismiss a capture candidate
*/
export declare const useDismissNode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof dismissNode>>, TError, {
        data: BodyType<DismissNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof dismissNode>>, TError, {
    data: BodyType<DismissNodeInput>;
}, TContext>;
export declare const getMergeNodeUrl: () => string;
/**
 * @summary Merge candidate with existing knowledge node
 */
export declare const mergeNode: (mergeNodeInput: MergeNodeInput, options?: RequestInit) => Promise<KnowledgeNode>;
export declare const getMergeNodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof mergeNode>>, TError, {
        data: BodyType<MergeNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof mergeNode>>, TError, {
    data: BodyType<MergeNodeInput>;
}, TContext>;
export type MergeNodeMutationResult = NonNullable<Awaited<ReturnType<typeof mergeNode>>>;
export type MergeNodeMutationBody = BodyType<MergeNodeInput>;
export type MergeNodeMutationError = ErrorType<unknown>;
/**
* @summary Merge candidate with existing knowledge node
*/
export declare const useMergeNode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof mergeNode>>, TError, {
        data: BodyType<MergeNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof mergeNode>>, TError, {
    data: BodyType<MergeNodeInput>;
}, TContext>;
export declare const getUndoNodeUrl: () => string;
/**
 * @summary Undo an auto-captured node within the 60-second window
 */
export declare const undoNode: (undoNodeInput: UndoNodeInput, options?: RequestInit) => Promise<ActionResult>;
export declare const getUndoNodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof undoNode>>, TError, {
        data: BodyType<UndoNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof undoNode>>, TError, {
    data: BodyType<UndoNodeInput>;
}, TContext>;
export type UndoNodeMutationResult = NonNullable<Awaited<ReturnType<typeof undoNode>>>;
export type UndoNodeMutationBody = BodyType<UndoNodeInput>;
export type UndoNodeMutationError = ErrorType<unknown>;
/**
* @summary Undo an auto-captured node within the 60-second window
*/
export declare const useUndoNode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof undoNode>>, TError, {
        data: BodyType<UndoNodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof undoNode>>, TError, {
    data: BodyType<UndoNodeInput>;
}, TContext>;
export declare const getListKnowledgeNodesUrl: (params?: ListKnowledgeNodesParams) => string;
/**
 * @summary List knowledge nodes with optional filters
 */
export declare const listKnowledgeNodes: (params?: ListKnowledgeNodesParams, options?: RequestInit) => Promise<KnowledgeNode[]>;
export declare const getListKnowledgeNodesQueryKey: (params?: ListKnowledgeNodesParams) => readonly ["/api/knowledge-nodes", ...ListKnowledgeNodesParams[]];
export declare const getListKnowledgeNodesQueryOptions: <TData = Awaited<ReturnType<typeof listKnowledgeNodes>>, TError = ErrorType<unknown>>(params?: ListKnowledgeNodesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listKnowledgeNodes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listKnowledgeNodes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListKnowledgeNodesQueryResult = NonNullable<Awaited<ReturnType<typeof listKnowledgeNodes>>>;
export type ListKnowledgeNodesQueryError = ErrorType<unknown>;
/**
 * @summary List knowledge nodes with optional filters
 */
export declare function useListKnowledgeNodes<TData = Awaited<ReturnType<typeof listKnowledgeNodes>>, TError = ErrorType<unknown>>(params?: ListKnowledgeNodesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listKnowledgeNodes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSemanticSearchNodesUrl: () => string;
/**
 * @summary Semantic similarity search over knowledge nodes
 */
export declare const semanticSearchNodes: (semanticSearchBody: SemanticSearchBody, options?: RequestInit) => Promise<SemanticSearchResult[]>;
export declare const getSemanticSearchNodesMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof semanticSearchNodes>>, TError, {
        data: BodyType<SemanticSearchBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof semanticSearchNodes>>, TError, {
    data: BodyType<SemanticSearchBody>;
}, TContext>;
export type SemanticSearchNodesMutationResult = NonNullable<Awaited<ReturnType<typeof semanticSearchNodes>>>;
export type SemanticSearchNodesMutationBody = BodyType<SemanticSearchBody>;
export type SemanticSearchNodesMutationError = ErrorType<unknown>;
/**
* @summary Semantic similarity search over knowledge nodes
*/
export declare const useSemanticSearchNodes: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof semanticSearchNodes>>, TError, {
        data: BodyType<SemanticSearchBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof semanticSearchNodes>>, TError, {
    data: BodyType<SemanticSearchBody>;
}, TContext>;
export declare const getGetKnowledgeNodeUrl: (nodeId: number) => string;
/**
 * @summary Get a single knowledge node
 */
export declare const getKnowledgeNode: (nodeId: number, options?: RequestInit) => Promise<KnowledgeNode>;
export declare const getGetKnowledgeNodeQueryKey: (nodeId: number) => readonly [`/api/knowledge-nodes/${number}`];
export declare const getGetKnowledgeNodeQueryOptions: <TData = Awaited<ReturnType<typeof getKnowledgeNode>>, TError = ErrorType<unknown>>(nodeId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getKnowledgeNode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getKnowledgeNode>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetKnowledgeNodeQueryResult = NonNullable<Awaited<ReturnType<typeof getKnowledgeNode>>>;
export type GetKnowledgeNodeQueryError = ErrorType<unknown>;
/**
 * @summary Get a single knowledge node
 */
export declare function useGetKnowledgeNode<TData = Awaited<ReturnType<typeof getKnowledgeNode>>, TError = ErrorType<unknown>>(nodeId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getKnowledgeNode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateKnowledgeNodeUrl: (nodeId: number) => string;
/**
 * @summary Update a knowledge node
 */
export declare const updateKnowledgeNode: (nodeId: number, knowledgeNodeUpdate: KnowledgeNodeUpdate, options?: RequestInit) => Promise<KnowledgeNode>;
export declare const getUpdateKnowledgeNodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateKnowledgeNode>>, TError, {
        nodeId: number;
        data: BodyType<KnowledgeNodeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateKnowledgeNode>>, TError, {
    nodeId: number;
    data: BodyType<KnowledgeNodeUpdate>;
}, TContext>;
export type UpdateKnowledgeNodeMutationResult = NonNullable<Awaited<ReturnType<typeof updateKnowledgeNode>>>;
export type UpdateKnowledgeNodeMutationBody = BodyType<KnowledgeNodeUpdate>;
export type UpdateKnowledgeNodeMutationError = ErrorType<unknown>;
/**
* @summary Update a knowledge node
*/
export declare const useUpdateKnowledgeNode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateKnowledgeNode>>, TError, {
        nodeId: number;
        data: BodyType<KnowledgeNodeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateKnowledgeNode>>, TError, {
    nodeId: number;
    data: BodyType<KnowledgeNodeUpdate>;
}, TContext>;
export declare const getGetCaptureSummaryUrl: () => string;
/**
 * @summary Get dashboard summary of capture pipeline stats
 */
export declare const getCaptureSummary: (options?: RequestInit) => Promise<CaptureSummary>;
export declare const getGetCaptureSummaryQueryKey: () => readonly ["/api/capture-summary"];
export declare const getGetCaptureSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getCaptureSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCaptureSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCaptureSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCaptureSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getCaptureSummary>>>;
export type GetCaptureSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary of capture pipeline stats
 */
export declare function useGetCaptureSummary<TData = Awaited<ReturnType<typeof getCaptureSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCaptureSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListEventsUrl: (params?: ListEventsParams) => string;
/**
 * @summary List recent event log entries
 */
export declare const listEvents: (params?: ListEventsParams, options?: RequestInit) => Promise<EventLog[]>;
export declare const getListEventsQueryKey: (params?: ListEventsParams) => readonly ["/api/events", ...ListEventsParams[]];
export declare const getListEventsQueryOptions: <TData = Awaited<ReturnType<typeof listEvents>>, TError = ErrorType<unknown>>(params?: ListEventsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEventsQueryResult = NonNullable<Awaited<ReturnType<typeof listEvents>>>;
export type ListEventsQueryError = ErrorType<unknown>;
/**
 * @summary List recent event log entries
 */
export declare function useListEvents<TData = Awaited<ReturnType<typeof listEvents>>, TError = ErrorType<unknown>>(params?: ListEventsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map