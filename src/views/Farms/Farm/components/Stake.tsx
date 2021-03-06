import React, { useCallback, useState } from 'react'
import {
  Button
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components'
import BigNumber from 'bignumber.js'

import { Contract } from 'web3-eth-contract'
import Card from '../../../../components/Card'
import CardContent from '../../../../components/CardContent'
import CardIcon from '../../../../components/CardIcon'
import Label from '../../../../components/Label'
import Value from '../../../../components/Value'
import DepositModal from '../../../../components/DepositModal'
import WithdrawModal from '../../../../components/WithdrawModal'

import useAllowance from '../../../../hooks/useAllowance'
import useApprove from '../../../../hooks/useApprove'
import useModal from '../../../../hooks/useModal'
import useStake from '../../../../hooks/useStake'
import useStakedBalance from '../../../../hooks/useStakedBalance'
import useTokenBalance from '../../../../hooks/useTokenBalance'
import useUnstake from '../../../../hooks/useUnstake'

import { getBalanceNumber } from '../../../../utils/formatBalance'
import { getDecimalFromSupportedPools } from '../../../../sushi/utils'

interface StakeProps {
  lpContract: Contract
  pid: number
  tokenName: string
}

const Stake: React.FC<StakeProps> = ({ lpContract, pid, tokenName }) => {
  const decimal = getDecimalFromSupportedPools(pid);

  const [requestedApproval, setRequestedApproval] = useState(false)

  const allowance = useAllowance(lpContract)
  const { onApprove } = useApprove(lpContract)

  const tokenBalance = useTokenBalance(lpContract.options.address)
  const stakedBalance = useStakedBalance(pid)

  const { onStake } = useStake(pid)
  const { onUnstake } = useUnstake(pid)

  const [onPresentDeposit] = useModal(
    <DepositModal
      max={tokenBalance}
      onConfirm={onStake}
      tokenName={tokenName}
    />,
  )

  const [onPresentWithdraw] = useModal(
    <WithdrawModal
      max={stakedBalance}
      onConfirm={onUnstake}
      tokenName={tokenName}
    />,
  )

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      const txHash = await onApprove()
      // user rejected tx or didn't go thru
      if (!txHash) {
        setRequestedApproval(false)
      }
    } catch (e) {
      console.log(e)
    }
  }, [onApprove, setRequestedApproval])

  return (
    <Card>
      <CardContent>
        <StyledCardContentInner>
          <StyledCardHeader>
            <CardIcon>???????????????</CardIcon>
            <Value value={getBalanceNumber(stakedBalance, decimal)} />
            <Label text={`${tokenName} Tokens Staked`} />
          </StyledCardHeader>
          <StyledCardActions>
            {!allowance.toNumber() ? (
              <EllipsisButton
                disabled={requestedApproval}
                onClick={handleApprove}
                type="primary"
                size="large"
                block
                title={`Approve ${tokenName}`}
              >
                {`Approve ${tokenName}`}
              </EllipsisButton>
            ) : (
              <>
                <Button
                  disabled={stakedBalance.eq(new BigNumber(0))}
                  type="primary"
                  size="large"
                  block
                  onClick={onPresentWithdraw}
                >Unstake</Button>
                <StyledActionSpacer />
                <Button
                  type="primary"
                  shape="round"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={onPresentDeposit}
                />
              </>
            )}
          </StyledCardActions>
        </StyledCardContentInner>
      </CardContent>
    </Card>
  )
}

const StyledCardHeader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const EllipsisButton = styled(Button)`
  overflow: hidden;
  text-overflow: ellipsis;
`

const StyledCardActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(props) => props.theme.spacing[6]}px;
  width: 100%;
`

const StyledActionSpacer = styled.div`
  height: ${(props) => props.theme.spacing[4]}px;
  width: ${(props) => props.theme.spacing[4]}px;
`

const StyledCardContentInner = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`

export default Stake
