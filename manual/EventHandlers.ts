import { Uuid } from '@dolittle/contracts.web/Protobuf/Uuid_pb';
import { GetAllRequest } from '@dolittle/contracts.web/Runtime/Management/Events.Processing/EventHandlers_pb';
import { EventHandlersPromiseClient } from '@dolittle/contracts.web/Runtime/Management/Events.Processing/EventHandlers_grpc_web_pb';
import { TenantScopedStreamProcessorStatus } from '@dolittle/contracts.web/Runtime/Management/Events.Processing/StreamProcessors_pb';

const client = new EventHandlersPromiseClient('/grpc');

export type EventType = {
    id: string;
    generation: number;
};

export type TenantStatus = {
    id: string;
    position: number;
    lastSuccessfullyProcessed: Date;
} & (
    {
        partitioned: false;
        failing: boolean;
        failureReason: string;
        retryCount: number;
        retryTime: Date;
    } | {
        partitioned: true;
        failingPartitions: {
            id: string;
            position: number;
            failureReason: string;
            retryCount: number;
            retryTime: Date;
            lastFailed: Date;
        }[];
    }
);

export type EventHandlerStatus = {
    id: string;
    alias: string;
    partitioned: boolean;
    scope: string;
    events: EventType[];
    tenants: TenantStatus[];
};

export const getAll = async (): Promise<EventHandlerStatus[]> => {
    const raw = await client.getAll(new GetAllRequest());

    const failure = raw.getFailure();
    if (failure !== undefined) {
        throw new Error(failure.getReason());
    }

    return raw.getEventhandlersList().map(status => ({
        id: uuidToString(status.getEventhandlerid()),
        alias: status.getAlias(),
        partitioned: status.getPartitioned(),
        scope: uuidToString(status.getScopeid()),
        events: status.getEventtypesList().map(type => ({
            id: uuidToString(type.getId()),
            generation: type.getGeneration(),
        })),
        tenants: status.getTenantsList().map(tenantStatus),
    }))
};

const tenantStatus = (status: TenantScopedStreamProcessorStatus): TenantStatus => {
    switch (status.getStatusCase()) {
        case TenantScopedStreamProcessorStatus.StatusCase.PARTITIONED:
            return {
                id: uuidToString(status.getTenantid()),
                position: status.getStreamposition(),
                lastSuccessfullyProcessed: status.getLastsuccessfullyprocessed()!.toDate(),
                partitioned: true,
                failingPartitions: status.getPartitioned()!.getFailingpartitionsList().map(partition => ({
                    id: partition.getPartitionid(),
                    position: partition.getStreamposition(),
                    failureReason: partition.getFailurereason(),
                    retryCount: partition.getRetrycount(),
                    retryTime: partition.getRetrytime()!.toDate(),
                    lastFailed: partition.getLastfailed()!.toDate(),
                })),
            };
        case TenantScopedStreamProcessorStatus.StatusCase.UNPARTITIONED:
            return {
                id: uuidToString(status.getTenantid()),
                position: status.getStreamposition(),
                lastSuccessfullyProcessed: status.getLastsuccessfullyprocessed()!.toDate(),
                partitioned: false,
                failing: status.getUnpartitioned()!.getIsfailing(),
                failureReason: status.getUnpartitioned()!.getFailurereason(),
                retryCount: status.getUnpartitioned()!.getRetrycount(),
                retryTime: status.getUnpartitioned()!.getRetrytime()!.toDate(),
            };
        default:
            throw new Error('Unknown TenantScopedStreamProcessorStatus case');
    }
};

const uuidToString = (uuid?: Uuid): string => {
    if (uuid === undefined) {
        return '<undefined>';
    }

    const buffer = uuid.getValue_asU8();
    const s = (i: number) => buffer[i].toString(16).padStart(2, '0');
    return s(3)+s(2)+s(1)+s(0)+'-'+s(5)+s(4)+'-'+s(7)+s(6)+'-'+s(8)+s(9)+'-'+s(10)+s(11)+s(12)+s(13)+s(14)+s(15);
}