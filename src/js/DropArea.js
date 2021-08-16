import React from 'react';

function DropArea({ children, onDrop }) {
  const handleDragOver = (e) => {
    e.stopPropagation();// 親要素のイベントをキャンセルする（バブリング）
    e.preventDefault(); // デフォルトアクションを抑止する（ブラウザがファイルをダウンロードするのをキャンセルする）
  };

  const handleDrop = (e) => {
    e.stopPropagation();
    e.preventDefault();

    onDrop(e);
  };

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop}>
      {children}
      {/* DropAreaで囲ったコンポーネントがここに入る */}
    </div>
  );
}
export { DropArea };
