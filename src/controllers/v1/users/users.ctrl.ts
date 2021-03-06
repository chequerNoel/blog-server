import express from 'express';

import User from '@app/database/models/user';
import { isLoggedIn } from '@app/middlewares/auth';
import { apiDoc } from '@app/lib/helpers/apidoc-helper';
import { asyncErrorHelper } from '@app/lib/helpers/base-helper';

const router = express.Router();

router.get('/check', apiDoc({ summary: '유저 정보 확인 api' }), (req, res) => {
  const { user } = req;
  if (user) return res.status(200).jsend({ data: user });
  res.status(401).jsend({ message: 'Unauthorized' });
});

router.delete(
  '/logout',
  apiDoc({ summary: '유저 로그아웃 api' }),
  isLoggedIn,
  asyncErrorHelper(async (req, res) => {
    const {
      user: { _id },
    } = req;

    await User.findByIdAndUpdate(_id, { $unset: { 'oAuth.local': 1 } });
    req.user = null;
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).end();
  }),
);

export = router;
