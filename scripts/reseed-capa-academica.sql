-- Vacía la capa académica para que AcademicDataInitializer vuelva a sembrarla
-- al próximo arranque del backend (solo corre si materia.count() == 0).
--
-- Por qué: los datos sembrados antes del refactor tienen 114 tutorías y eventos
-- pisando reservas aprobadas, porque el seeder elegía espacio al azar sin mirar
-- la agenda. Ya se corrigió (AcademicDataInitializer.espacioLibre), pero los
-- datos viejos siguen ahí y solo se limpian re-sembrando.
--
-- Backup previo (solo datos) tomado con:
--   docker exec ut_db pg_dump -U ut_user -d utec_db --data-only \
--     -t materia -t materia_prerrequisito -t inscripcion_materia -t recurso_academico \
--     -t tutoria -t tutoria_reserva -t tutoria_feedback -t tutoria_recurso \
--     -t evento -t evento_inscripcion -t evento_feedback -t evento_externo > backup.sql
--
-- No afecta a MinIO: los recursos sembrados apuntan a objetos que no existen
-- (el bucket solo tiene "espacios", vacío).
-- No afecta a usuarios, carreras, espacios, reservas ni inventario.

BEGIN;

-- Hijas primero, para no violar las FKs.
DELETE FROM tutoria_feedback;
DELETE FROM tutoria_recurso;
DELETE FROM tutoria_reserva;
DELETE FROM tutoria;

DELETE FROM evento_feedback;
DELETE FROM evento_inscripcion;
DELETE FROM evento;

DELETE FROM recurso_academico;
DELETE FROM inscripcion_materia;
DELETE FROM materia_prerrequisito;
DELETE FROM materia;

COMMIT;
