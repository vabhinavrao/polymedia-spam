import { SPAM_DECIMALS, Stats } from "@polymedia/spam-sdk";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { formatBigInt, formatNumber } from "@polymedia/suits";

export const PageStats: React.FC = () =>
{
    const { spamClient } = useOutletContext<AppContext>();
    const [ stats, setStats ] = useState<Stats>();

    useEffect(() => {
        const initialize = async () => {
            const newStats = await spamClient.fetchStatsForRecentEpochs(30);
            setStats(newStats);
        };
        initialize();
    }, []);

    return <>
        <h1>Stats</h1>
        {!stats
        ? <p>Loading...</p>
        : <>
            <div className="tight">
                <p>Current epoch: {stats.epoch}</p>
                <p>System status: {stats.paused ? "paused" : "running"}</p>
                <p>Circulating supply: {formatBigInt(BigInt(stats.supply), SPAM_DECIMALS, "compact")}</p>
                <p>Total transactions: {formatNumber(Number(stats.tx_count), "compact")}</p>
            </div>

            {stats.epochs.length > 0 &&
            <>
                <h2>Epochs:</h2>
                <div className="tight">
                {stats.epochs.map(epoch =>
                    <p key={epoch.epoch}>
                        Epoch {epoch.epoch}: {formatNumber(Number(epoch.tx_count), "compact")} transactions
                    </p>
                )}
                </div>
            </>}
        </>}
    </>;
};
