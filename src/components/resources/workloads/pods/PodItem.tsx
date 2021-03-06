import { IonItem, IonLabel } from '@ionic/react';
import { V1Pod } from '@kubernetes/client-node';
import React, { useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';

import { IContext, IPodMetrics } from '../../../../declarations';
import { AppContext } from '../../../../utils/context';
import { timeDifference } from '../../../../utils/helpers';
import ItemStatus from '../../misc/template/ItemStatus';
import { getReady, getResources, getRestarts, getStatus } from './podHelpers';

interface IPodItemProps extends RouteComponentProps {
  item: V1Pod;
  section: string;
  type: string;
}

const PodItem: React.FunctionComponent<IPodItemProps> = ({ item, section, type }: IPodItemProps) => {
  const context = useContext<IContext>(AppContext);

  const [metrics, setMetrics] = useState<IPodMetrics>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: IPodMetrics = await context.request(
          'GET',
          `/apis/metrics.k8s.io/v1beta1/namespaces/${
            item.metadata && item.metadata.namespace ? item.metadata.namespace : ''
          }/pods/${item.metadata && item.metadata.name ? item.metadata.name : ''}`,
          '',
        );
        setMetrics(data);
      } catch (err) {
        // TODO: Implement error handling.
      }
    };

    if (item.metadata && item.metadata.namespace && item.metadata.name) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, type]);

  const podStatus = getStatus(item);

  const status = (): string => {
    if (podStatus === 'Pending') {
      return 'warning';
    }

    if (podStatus === 'Running' || podStatus === 'Completed') {
      return 'success';
    }

    return 'danger';
  };

  // - Ready: The number of ready containers and the number of containers in the pod.
  // - Restarts: Number of restarts for the pod, using the sum of restarts for all containers.
  // - Status: Show the status of the pod, using the status of the running containers.
  // - Resources: Show the requests and limits for CPU and Memory.
  // - Age: The time when the pod was created.
  return (
    <IonItem
      routerLink={`/resources/${section}/${type}/${item.metadata ? item.metadata.namespace : ''}/${
        item.metadata ? item.metadata.name : ''
      }`}
      routerDirection="forward"
    >
      <ItemStatus status={status()} />
      <IonLabel>
        <h2>{item.metadata ? item.metadata.name : ''}</h2>
        <p>
          Ready: {getReady(item)} | Restarts: {getRestarts(item)} | Status: {podStatus}
          {item.spec && item.spec.initContainers && item.spec.containers
            ? ` | ${getResources(item.spec.initContainers.concat(item.spec.containers), metrics)}`
            : item.spec && item.spec.containers
            ? ` | ${getResources(item.spec.containers, metrics)}`
            : ''}
          {item.metadata && item.metadata.creationTimestamp
            ? ` | Age: ${timeDifference(
                new Date().getTime(),
                new Date(item.metadata.creationTimestamp.toString()).getTime(),
              )}`
            : ''}
        </p>
      </IonLabel>
    </IonItem>
  );
};

export default PodItem;
