const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const ctrl = require('./training.controller');

router.use(authenticate);

router.get('/',                                        requirePermission('training', 'read'),   ctrl.listCourses);
router.post('/',                                       requirePermission('training', 'create'), ctrl.createCourse);
router.get('/my-courses',                              requirePermission('training', 'read'),   ctrl.myCourses);
router.get('/certifications',                          requirePermission('training', 'read'),   ctrl.listCertifications);
router.get('/:id',                                     requirePermission('training', 'read'),   ctrl.getCourse);
router.put('/:id',                                     requirePermission('training', 'update'), ctrl.updateCourse);
router.post('/:id/publish',                            requirePermission('training', 'update'), ctrl.publishCourse);
router.get('/:id/modules',                             requirePermission('training', 'read'),   ctrl.listModules);
router.post('/:id/modules',                            requirePermission('training', 'update'), ctrl.addModule);
router.post('/:id/enroll',                             requirePermission('training', 'update'), ctrl.enrollUsers);
router.get('/:id/enrollments',                         requirePermission('training', 'read'),   ctrl.listEnrollments);
router.post('/enrollments/:enrollmentId/progress',     requirePermission('training', 'update'), ctrl.updateProgress);
router.post('/enrollments/:enrollmentId/complete',     requirePermission('training', 'update'), ctrl.completeEnrollment);

module.exports = router;
