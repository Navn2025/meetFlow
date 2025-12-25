import React, {useEffect} from 'react'
import MainRoutes from './router/MainRoutes'
import {useDispatch} from 'react-redux'
import {getUser} from './store/auth.slice';

const App=() =>
{
  const dispatch=useDispatch();
  useEffect(() =>
  {
    const fetchdata=async () =>
    {

      const res=await dispatch(getUser());
      console.log(res)
    }
    fetchdata();
  }, [dispatch])
  return (
    <div className="w-full min-h-screen">
      <MainRoutes />
    </div>
  )
}

export default App