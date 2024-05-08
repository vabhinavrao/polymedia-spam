import { SPAM_DECIMALS, Stats } from "@polymedia/spam-sdk";
import { NetworkName, convertBigIntToNumber, formatNumber } from "@polymedia/suits";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { EpochData, formatEpochPeriod, getEpochTimes } from "./lib/epochs";

const newSupplyPerEpoch = 1_000_000_000;
const gasPerTx = 0.000774244;
const firstEpoch: Record<NetworkName, number> = {
    mainnet: 386,
    testnet: 357,
    devnet: 0,
    localnet: 0,
};

export const PageStats: React.FC = () =>
{
    /* State */

    const { network, spammer } = useOutletContext<AppContext>();
    const [ stats, setStats ] = useState<Stats>();
    const [ currEpoch, setCurrEpoch ] = useState<EpochData>();

    /* Functions */

    useEffect(() => {
        updateStats();
        updateCurrEpoch();
    }, [spammer.current, network]);

    const updateStats = async () => {
        try {
            setStats(undefined);
            const newStats = await spammer.current.getSpamClient().fetchStatsForRecentEpochs(14);
            // Prepend a synthetic epoch counter for the current epoch
            newStats.epochs.unshift({
                epoch: newStats.epoch,
                tx_count: "0",
            });
            setStats(newStats);
        } catch (err) {
            console.warn("stats update failed");
        }
    };

    const updateCurrEpoch = async () => {
        try {
            setCurrEpoch(undefined);
            const suiState = await spammer.current.getSuiClient().getLatestSuiSystemState();
            setCurrEpoch({
                epochNumber: Number(suiState.epoch),
                durationMs: Number(suiState.epochDurationMs),
                startTimeMs: Number(suiState.epochStartTimestampMs),
            });
        } catch (err) {
            console.warn("epoch update failed");
        }
    };

    /* HTML */

    const CounterCard: React.FC<{
        epoch: { epoch: string; tx_count: string };
    }> = ({
        epoch,
    }) => {
        const epochNumber = Number(epoch.epoch);
        const epochTimes = currEpoch && getEpochTimes(epochNumber, currEpoch);
        const epochTxs = Number(epoch.tx_count);
        const epochGas = epochTxs * gasPerTx;
        const spamPerTx = newSupplyPerEpoch / epochTxs;
        const suiPerSpam = epochGas / newSupplyPerEpoch;

        let epochType: "" | "current" | "register" | "claim";
        if (!currEpoch) {
            epochType = "";
        } else if (epochNumber === currEpoch.epochNumber) {
            epochType = "current";
        } else if (epochNumber === currEpoch.epochNumber - 1) {
            epochType = "register";
        } else {
            epochType = "claim";
        }

        return <div className={`counter-card ${epochType}`}>
            <div>
                <div className="counter-epoch">Epoch {epoch.epoch}</div>
                <div>{(() => {
                    if (epochType === "current") {
                        return "spamming now"
                    }
                    if (epochType === "register") {
                        return "registering now";
                    }
                    return null;
                })()}</div>
            </div>

            {epochTimes &&
            <div>
                <div>
                    {formatEpochPeriod(epochTimes.startTime, epochTimes.endTime, false)}
                </div>
            </div>
            }

            <div>
                <div>
                    {(() => {
                        if (epochType === "current") {
                            return "Transactions: ongoing";
                        }
                        if (epochType === "register") {
                            return `Transactions: ${formatNumber(epochTxs)} registered so far`;
                        }
                        return `Transactions: ${formatNumber(epochTxs)}`;
                    })()}
                </div>
            </div>

            {epochGas > 0 &&
            <div>
                <div>
                    Gas paid: {formatNumber(epochGas)} SUI
                </div>
            </div>
            }

            {Number.isFinite(spamPerTx) &&
            <div>
                <div>
                    SPAM per tx: {formatNumber(spamPerTx)}
                </div>
            </div>
            }

            {suiPerSpam > 0 &&
            <div>
                <div>
                    SUI per SPAM: {suiPerSpam.toFixed(8)}
                </div>
            </div>
            }
        </div>;
    };

    const heading = <h1><span className="rainbow">Stats</span></h1>;

    if (!stats) {
        return <>
            {heading}
            <p>Loading...</p>
        </>
    }

    const totalTxs = Number(stats.tx_count);
    const totalGas = totalTxs * gasPerTx;
    const claimedSupply = convertBigIntToNumber(BigInt(stats.supply), SPAM_DECIMALS);
    const epochsCompleted = Number(stats.epoch) - 1 - firstEpoch[network];
    const availableSupply = epochsCompleted * newSupplyPerEpoch;

    return <>
        {heading}
        <div className="tight">
            <p>Total transactions: {formatNumber(totalTxs, "standard")}</p>
            <p>Total gas paid: {formatNumber(totalGas, "compact")} SUI</p>
            <p>Circulating supply: {formatNumber(claimedSupply, "compact")}</p>
            <p>Available supply: {formatNumber(availableSupply, "compact")}</p>
            <p>Epochs completed: {epochsCompleted}</p>
            <p>Current epoch: {stats.epoch}</p>
            {/* <p>System status: {stats.paused ? "paused" : "running"}</p> */}
        </div>

        {stats.epochs.length > 0 &&
        <>
            <br/>
            <h2>Epochs:</h2>

            <div className="counter-cards">
                {stats.epochs.map(epoch =>
                    <CounterCard epoch={epoch} key={epoch.epoch} />
                )}
            </div>
        </>}
    </>;
};
