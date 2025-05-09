import React from 'react';
import { UpdateHistory as IUpdateHistory } from '../../types/device';
import { formatDate } from '../../utils/formatter';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Loading from '../shared/Loading';

interface UpdateHistoryListProps {
    history: IUpdateHistory[];
    isLoading: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const UpdateHistoryList: React.FC<UpdateHistoryListProps> = ({ 
    history, 
    isLoading,
    onRefresh,
    isRefreshing
}) => {
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-120px)] bg-white shadow rounded-lg p-6 flex items-center justify-center">
                <Loading />
            </div>
        );
    }

return (
  <div className="min-h-[calc(100vh-120px)] p-14 -mt-6 flex flex-col">
    <div className="flex flex-col">
      <div className="flex items-center mb-2">
        <h2 className="text-2xl font-semibold ml-2 mr-4 ㅡflex-none">History</h2>
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-full bg-gray-50 shadow-sm border border-gray-200 hover:bg-gray-100 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
          title="업데이트 이력 새로고침"
        >
          <ArrowPathIcon className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <hr className="border-gray-200 mt-2 mb-8" />
    </div>

    {history.length === 0 ? (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600">업데이트 이력이 없습니다.</p>
      </div>
    ) : (
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[50px] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업데이트</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item, index) => (
              <tr key={item.uid} className="hover:bg-gray-50">
                <td className="px-2 py-4 text-center text-sm text-gray-900 w-[35px]">{index + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.uid}</td>
                <td className="px-6 py-4 text-sm text-gray-900">v{item.version}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isPurchased ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isPurchased ? '구매 완료' : '미구매'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isInstalled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isInstalled ? '설치 완료' : '미설치'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {`${item.price_eth} ETH`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.installedAt
                    ? formatDate(item.installedAt)
                    : item.purchasedAt
                    ? formatDate(item.purchasedAt)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
}