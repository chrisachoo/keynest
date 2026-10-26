UPDATE `user` SET `email` = lower(trim(`email`)) WHERE `email` != lower(trim(`email`));
