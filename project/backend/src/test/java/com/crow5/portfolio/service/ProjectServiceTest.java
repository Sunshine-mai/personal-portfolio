package com.crow5.portfolio.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.crow5.portfolio.dto.ProjectCreateRequest;
import com.crow5.portfolio.entity.Project;
import com.crow5.portfolio.entity.Revision;
import com.crow5.portfolio.mapper.ProjectMapper;
import com.crow5.portfolio.mapper.RevisionMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProjectServiceTest {
    @Test
    void createsProjectAndFirstDraftRevision() {
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        RevisionMapper revisionMapper = mock(RevisionMapper.class);
        ProjectService service = new ProjectService(projectMapper, revisionMapper, new ObjectMapper());

        doAnswer(invocation -> {
            invocation.getArgument(0, Project.class).setId(7L);
            return 1;
        }).when(projectMapper).insert(any(Project.class));

        service.createDraft(new ProjectCreateRequest("demo", "Demo", "s", "b", "o", "r", null));

        ArgumentCaptor<Revision> revision = ArgumentCaptor.forClass(Revision.class);
        verify(revisionMapper).insert(revision.capture());
        assertEquals(7L, revision.getValue().getProjectId());
        assertEquals("DRAFT", revision.getValue().getStatus());
    }

    @Test
    void submitsDraftProjectAndRevisionForReview() {
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        RevisionMapper revisionMapper = mock(RevisionMapper.class);
        ProjectService service = new ProjectService(projectMapper, revisionMapper, new ObjectMapper());
        Project project = new Project();
        project.setId(7L);
        project.setStatus("DRAFT");
        Revision revision = new Revision();
        revision.setProjectId(7L);
        revision.setNumber(1);
        revision.setStatus("DRAFT");
        when(projectMapper.selectById(7L)).thenReturn(project);
        when(revisionMapper.selectOne(any())).thenReturn(revision);

        service.submitReview(7L);

        assertEquals("READY_FOR_REVIEW", project.getStatus());
        assertEquals("READY_FOR_REVIEW", revision.getStatus());
        verify(projectMapper).updateById(project);
        verify(revisionMapper).updateById(revision);
    }

    @Test
    void rejectsSubmittingProjectOutsideDraftState() {
        ProjectMapper projectMapper = mock(ProjectMapper.class);
        RevisionMapper revisionMapper = mock(RevisionMapper.class);
        ProjectService service = new ProjectService(projectMapper, revisionMapper, new ObjectMapper());
        Project project = new Project();
        project.setId(7L);
        project.setStatus("READY_FOR_REVIEW");
        when(projectMapper.selectById(7L)).thenReturn(project);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.submitReview(7L));

        assertEquals("INVALID_STATE_TRANSITION", exception.getMessage());
        verifyNoInteractions(revisionMapper);
    }
}
