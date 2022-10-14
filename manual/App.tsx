import { useEffect, useState } from 'react';

import { getAll, EventHandlerStatus } from './EventHandlers';

export const App = () => {
    const [statuses, setStatuses] = useState<EventHandlerStatus[]>([]);

    useEffect(() => {
        getAll()
            .then(statuses => { console.log(statuses); setStatuses(statuses); })
            .catch(err => console.error(err));
    }, []);

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Alias</th>
                        <th>ID</th>
                        <th>Partitioned</th>
                        <th>Tenants</th>
                    </tr>
                </thead>
                <tbody>
                    { statuses.map(status =>
                        <tr key={status.id}>
                            <td>{status.alias}</td>
                            <td>{status.id}</td>
                            <td>{status.partitioned ? '✅' : '❌'}</td>
                            <td>
                                { status.tenants.map(status =>
                                    <div key={status.id}>
                                        {`${status.id} : ${status.position} : ${status.lastSuccessfullyProcessed}`}
                                    </div>
                                )}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
};
