import React from 'react';
import '../css/404.css';

const NotFound: React.FC = () => {
  return (
    <div className="background">
      <h1 className='nfh'>404</h1>
      <p className='nfp'>페이지를 찾을 수 없습니다.</p>
      <a className='nfa' href="/">로그인 페이지로 돌아가기</a>
    </div>
  );
}

export default NotFound;
