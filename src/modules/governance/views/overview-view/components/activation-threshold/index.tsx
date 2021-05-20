import React from 'react';
import cn from 'classnames';
import { formatBONDValue } from 'web3/utils';

import Button from 'components/antd/button';
import Grid from 'components/custom/grid';
import Icon from 'components/custom/icon';
import ProgressNew from 'components/custom/progress';
import { Hint, Text } from 'components/custom/typography';
import { XyzToken } from 'components/providers/known-tokens-provider';

import { useDAO } from '../../../../components/dao-provider';

export type ActivationThresholdProps = {
  className?: string;
};

const ActivationThreshold: React.FC<ActivationThresholdProps> = props => {
  const dao = useDAO();
  const [activating, setActivating] = React.useState<boolean>(false);

  function handleActivate() {
    setActivating(true);
    dao.actions
      .activate()
      .catch(Error)
      .then(() => {
        setActivating(false);
      });
  }

  return (
    <div className={cn('card p-24', props.className)}>
      <Grid flow="row" gap={24} align="start">
        <Hint
          text={
            <Text type="p2">
              For the {XyzToken.symbol} to be activated, a threshold of {formatBONDValue(dao.activationThreshold)} XYZ
              tokens staked has to be met.
            </Text>
          }>
          <Text type="p2" weight="bold" color="primary" font="secondary">
            Activation threshold
          </Text>
        </Hint>
        <Grid gap={12} colsTemplate="auto 24px" width="100%">
          <ProgressNew percent={dao.activationRate} colors={{ bg: 'var(--gradient-green)' }} height={24} />
          <Icon name="ribbon-outlined" />
        </Grid>
        <Grid flow="col" gap={8} align="center">
          <Icon name="png/universe" width={32} height={32} />
          <Text type="p1" weight="bold" color="primary">
            {formatBONDValue(dao.xyzStaked)}
          </Text>
          <Text type="p1" weight="semibold" color="secondary">
            / {formatBONDValue(dao.activationThreshold)} already staked.
          </Text>
        </Grid>
        {dao.activationRate === 100 && !dao.isActive && (
          <Button type="primary" loading={activating} onClick={handleActivate}>
            Activate
          </Button>
        )}
      </Grid>
    </div>
  );
};

export default ActivationThreshold;
