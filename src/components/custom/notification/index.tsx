import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import * as dateFns from 'date-fns';
import format from 'date-fns/format';
import formatDuration from 'date-fns/formatDuration';
import intervalToDuration from 'date-fns/intervalToDuration';
import isThisWeek from 'date-fns/isThisWeek';
import isToday from 'date-fns/isToday';
import Erc20Contract from 'web3/erc20Contract';
import { getEtherscanAddressUrl, getHumanValue, shortenAddr } from 'web3/utils';

import Icon, { IconNames } from 'components/custom/icon';
import IconNotification from 'components/custom/icon-notification';
import { Text } from 'components/custom/typography';
import { NotificationType, useNotifications } from 'components/providers/notifications-provider';
import { useReload } from 'hooks/useReload';

import { LeagueToken } from '../../providers/known-tokens-provider';
import ExternalLink from '../externalLink';
import NotificationIcon from './icon';

import { getSessionContractByAddress, setSessionContractByAddress } from 'utils/contracts';

import s from './s.module.scss';

// @ts-ignore
window['dateFns'] = dateFns;
const colorPairs: Record<'green' | 'red' | 'blue' | 'yellow', [string, string]> = {
  green: ['--theme-green-color', '--theme-green-color-rgb'],
  red: ['--theme-red-color', '--theme-red-color-rgb'],
  blue: ['--theme-blue-color', '--theme-blue-color-rgb'],
  yellow: ['--theme-yellow-color', '--theme-yellow-color-rgb'],
};

function getProposalLink(id: number): React.ReactNode {
  return <Link className="link-yellow" to={`/governance/proposals/${id}`}>{`PID-${id}`}</Link>;
}

function getStrongText(text: string = ''): React.ReactNode {
  return (
    <Text type="p2" tag="strong" weight="bold" color="primary">
      {text}
    </Text>
  );
}

function getRelativeTime(seconds: number) {
  return formatDuration(intervalToDuration({ start: 0, end: seconds * 1000 }));
}

function getData(n: NotificationType, reload: Function): [IconNames, [string, string], React.ReactNode] {
  switch (n.notificationType) {
    case 'proposal-created':
      return [
        'add-file',
        colorPairs.blue,
        <>
          <Text type="p2" weight="semibold" color="secondary" className="mb-16">
            Proposal {getProposalLink(n.metadata.proposalId)} has been created by{' '}
            {getStrongText(shortenAddr(n.metadata.proposer))} and entered the warm-up phase. You have{' '}
            {getStrongText(getRelativeTime(n.metadata.displayDuration))} to stake your {LeagueToken.symbol}
          </Text>
          <Link to="/governance/wallet/deposit" className="button-primary">
            Deposit now
          </Link>
        </>,
      ];
    case 'proposal-activating-soon':
      return [
        'stopwatch',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          Voting on proposal {getProposalLink(n.metadata.proposalId)} starts in {getStrongText('5 minutes')}
        </Text>,
      ];
    case 'proposal-canceled':
      return [
        'file-deleted',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has been cancelled by{' '}
          <ExternalLink href={getEtherscanAddressUrl(n.metadata.caller)} className="link-yellow">
            {shortenAddr(n.metadata.caller)}
          </ExternalLink>
        </Text>,
      ];
    case 'proposal-voting-open':
      return [
        'judge',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has entered the voting period. You have{' '}
          {getStrongText(getRelativeTime(n.metadata.displayDuration))} to cast your vote
        </Text>,
      ];
    case 'proposal-voting-ending-soon':
      return [
        'judge',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Voting on proposal {getProposalLink(n.metadata.proposalId)} ends in {getStrongText('5 minutes')}
        </Text>,
      ];
    case 'proposal-outcome':
      return [
        'file-clock',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          {n.message}
        </Text>,
      ];
    case 'proposal-accepted':
      return [
        'file-clock',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has been accepted with{' '}
          {getStrongText(`${n.metadata.votedRatio}%`)} votes for. You have{' '}
          {getStrongText(getRelativeTime(n.metadata.displayDuration))} to queue it for execution
        </Text>,
      ];
    case 'proposal-failed-quorum':
      return [
        'file-deleted',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has not met quorum and has been rejected
        </Text>,
      ];
    case 'proposal-failed-votes':
      return [
        'file-deleted',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has been rejected with {n.metadata.votedRatio}% votes
          against
        </Text>,
      ];
    case 'proposal-queued':
      return [
        'queue',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has been queued for execution by{' '}
          {getStrongText(shortenAddr(n.metadata.caller))}. You have{' '}
          {getStrongText(getRelativeTime(n.metadata.displayDuration))} to create an abrogation proposal
        </Text>,
      ];
    case 'proposal-queue-ending-soon':
      return [
        'queue',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Queue period on proposal {getProposalLink(n.metadata.proposalId)} ends in {getStrongText('5 minutes')}
        </Text>,
      ];
    case 'proposal-grace':
      return [
        'gear',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has passed the queue period. You have{' '}
          {getStrongText(getRelativeTime(n.metadata.displayDuration))} to execute it
        </Text>,
      ];
    case 'proposal-executed':
      return [
        'file-added',
        colorPairs.green,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has been executed by{' '}
          {getStrongText(shortenAddr(n.metadata.caller))}
        </Text>,
      ];
    case 'proposal-expires-soon':
      return [
        'file',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} expires in {getStrongText('5 minutes')}
        </Text>,
      ];
    case 'proposal-expired':
      return [
        'file-deleted',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has expired
        </Text>,
      ];
    case 'abrogation-proposal-created':
      return [
        'file-times',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          Abrogation proposal for proposal {getProposalLink(n.metadata.proposalId)} has been created by{' '}
          {getStrongText(shortenAddr(n.metadata.proposer))}. You have{' '}
          {getStrongText(getRelativeTime(n.metadata.displayDuration))} to vote on the abrogation proposal
        </Text>,
      ];
    case 'proposal-abrogated':
      return [
        'file-deleted',
        colorPairs.red,
        <Text type="p2" weight="semibold" color="secondary">
          Proposal {getProposalLink(n.metadata.proposalId)} has been abrogated
        </Text>,
      ];
    case 'delegate-start':
      return [
        'handshake',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          {getStrongText(
            `${getHumanValue(new BigNumber(n.metadata.amount ?? 0), LeagueToken.decimals)?.toFixed()} v${LeagueToken.symbol}`,
          )}{' '}
          has been delegated to you from{' '}
          <ExternalLink href={getEtherscanAddressUrl(n.metadata.from)} className="link-yellow">
            {shortenAddr(n.metadata.from)}
          </ExternalLink>
        </Text>,
      ];
    case 'smart-yield-token-bought': {
      const contract = getSessionContractByAddress(n.metadata.syPoolAddress);
      if (!contract || !contract.symbol) {
        const syPoolContract = new Erc20Contract([], n.metadata.syPoolAddress);
        syPoolContract.loadCommon().then(() => {
          if (syPoolContract.symbol) {
            setSessionContractByAddress(n.metadata.syPoolAddress, {
              symbol: syPoolContract.symbol,
            });
            reload();
          }
        });
      }
      return [
        'stake',
        colorPairs.blue,
        <>
          <Text type="p2" weight="semibold" color="secondary" className="mb-16">
            Stake your{' '}
            {getStrongText(`${Intl.NumberFormat('en').format(Number(n.metadata.amount))} ${contract?.symbol ?? ''}`)} to
            earn extra yield
          </Text>
          <Link
            to={`/smart-yield/pool?m=${n.metadata.protocolId}&t=${n.metadata.underlyingSymbol}`}
            className="button-primary">
            Stake now
          </Link>
        </>,
      ];
    }
    default:
      console.log(`Unsupported notification type: ${JSON.stringify(n)}`);
      return [
        'notification',
        colorPairs.blue,
        <Text type="p2" weight="semibold" color="secondary">
          {/* @ts-ignore */}
          {n.message}
        </Text>,
      ];
  }
}

function getIcon(name: IconNames, colors: [string, string], bubble: boolean) {
  return (
    <IconNotification width={40} height={40} className="mr-16" bubble={bubble}>
      <NotificationIcon rgbVarName={colors[1]}>
        <Icon name={name} width="24" height="24" style={{ color: `var(${colors[0]})` }} />
      </NotificationIcon>
    </IconNotification>
  );
}

function formatTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEEEE');
  }

  return format(date, 'dd MMM yyyy');
}

type Props = {
  n: NotificationType;
};

export const Notification: React.FC<Props> = ({ n }) => {
  const { notificationsReadUntil } = useNotifications();
  const [reload] = useReload();
  const [iconName, colors, content] = getData(n, reload);
  const date = new Date(n.startsOn * 1000);
  const isUnread = notificationsReadUntil ? notificationsReadUntil < n.startsOn : false;

  return (
    <div className={s.n}>
      {getIcon(iconName, colors, isUnread)}
      <div style={{ flexGrow: 1 }}>{content}</div>
      <time className={s.time} dateTime={date.toJSON()} title={date.toJSON()}>
        {formatTime(date)}
      </time>
    </div>
  );
};

type ToastProps = {
  n: NotificationType;
  onClose: (id: NotificationType['id']) => void;
  timeout?: number;
};

export const Toast: React.FC<ToastProps> = ({ n, onClose, timeout }) => {
  const [reload] = useReload();
  const [iconName, colors, content] = getData(n, reload);
  useEffect(() => {
    if (timeout && timeout !== Infinity) {
      setTimeout(onClose, timeout, n.id);
    }
  }, [timeout]);

  return (
    <div className={cn(s.n, s.toast)}>
      {getIcon(iconName, colors, false)}
      <div style={{ flexGrow: 1 }}>{content}</div>
      <button type="button" onClick={() => onClose(n.id)} className={s.close}>
        <Icon name="close-tiny" width="24" height="24" color="inherit" />
      </button>
    </div>
  );
};
