import React, { useEffect, useState } from 'react';
import { UpdateHistory as IUpdateHistory } from '../../types/device';
import { deviceApi } from '../../services/api';
import Loading from '../shared/Loading';

export const UpdateHistory: React.FC = () => {
    const [history, setHistory] = useState<IUpdateHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await deviceApi.getHistory();
                setHistory(data.history);
            } catch (error) {
                console.error('업데이트 이력 로드 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) return <Loading />;

    if (history.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">업데이트 이력</h2>
                <p className="text-gray-600">업데이트 이력이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">업데이트 이력</h2>
            <div className="space-y-4">
                {history.map((item, index) => (
                    <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-medium">버전 {item.version}</h3>
                                <p className="text-gray-600">{item.description}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(item.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <a
                                href={`https://etherscan.io/tx/${item.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                트랜잭션 보기
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};