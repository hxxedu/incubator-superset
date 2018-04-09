import React from 'react';
import { shallow } from 'enzyme';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import * as sliceActions from '../../../javascripts/dashboard/actions/allSlices';
import * as dashboardActions from '../../../javascripts/dashboard/actions/dashboard';
import * as chartActions from '../../../javascripts/chart/chartAction';
import Dashboard from '../../../javascripts/dashboard/components/Dashboard';
import { defaultFilters, dashboard, datasources, charts, allSlices } from './fixtures';

describe('Dashboard', () => {
  const mockedProps = {
    actions: { ...chartActions, ...dashboardActions, ...sliceActions },
    initMessages: [],
    dashboard: dashboard.dashboard,
    charts,
    slices: allSlices.slices,
    datasources,
    layout: {},
    filters: dashboard.filters,
    refresh: false,
    timeout: 60,
    isStarred: false,
    userId: dashboard.userId,
  };

  it('should render', () => {
    const wrapper = shallow(<Dashboard {...mockedProps} />);
    expect(wrapper.find('#dashboard-container')).to.have.length(1);
    expect(wrapper.instance().getAllCharts()).to.have.length(3);
  });

  it('should handle metadata default_filters', () => {
    const wrapper = shallow(<Dashboard {...mockedProps} />);
    expect(wrapper.instance().props.filters).deep.equal(defaultFilters);
  });

  describe('getFormDataExtra', () => {
    let wrapper;
    let selectedChart;
    beforeEach(() => {
      wrapper = shallow(<Dashboard {...mockedProps} />);
      selectedChart = charts.slice_248;
    });

    it('should carry default_filters', () => {
      const extraFilters = wrapper.instance().getFormDataExtra(selectedChart).extra_filters;
      expect(extraFilters[0]).to.deep.equal({ col: 'region', op: 'in', val: [] });
      expect(extraFilters[1]).to.deep.equal({ col: 'country_name', op: 'in', val: ['United States'] });
    });

    it('should carry updated filter', () => {
      wrapper.setProps({
        filters: {
          256: { region: [] },
          257: { country_name: ['France'] },
        },
      });
      const extraFilters = wrapper.instance().getFormDataExtra(selectedChart).extra_filters;
      expect(extraFilters[1]).to.deep.equal({ col: 'country_name', op: 'in', val: ['France'] });
    });
  });

  describe('refreshExcept', () => {
    let wrapper;
    let spy;
    beforeEach(() => {
      wrapper = shallow(<Dashboard {...mockedProps} />);
      spy = sinon.spy(wrapper.instance(), 'fetchCharts');
    });
    afterEach(() => {
      spy.restore();
    });

    it('should not refresh filter slice', () => {
      const filterKey = Object.keys(defaultFilters)[1];
      wrapper.instance().refreshExcept(filterKey);
      expect(spy.callCount).to.equal(1);
      expect(spy.getCall(0).args[0].length).to.equal(1);
    });

    it('should refresh all slices', () => {
      wrapper.instance().refreshExcept();
      expect(spy.callCount).to.equal(1);
      expect(spy.getCall(0).args[0].length).to.equal(3);
    });
  });

  describe('componentDidUpdate', () => {
    let wrapper;
    let refreshExceptSpy;
    let fetchSlicesStub;
    let prevProp;
    beforeEach(() => {
      wrapper = shallow(<Dashboard {...mockedProps} />);
      prevProp = wrapper.instance().props;
      refreshExceptSpy = sinon.spy(wrapper.instance(), 'refreshExcept');
      fetchSlicesStub = sinon.stub(wrapper.instance(), 'fetchCharts');
    });
    afterEach(() => {
      fetchSlicesStub.restore();
      refreshExceptSpy.restore();
    });

    describe('should check if filter has change', () => {
      beforeEach(() => {
        refreshExceptSpy.reset();
      });
      it('no change', () => {
        wrapper.setProps({
          refresh: true,
          filters: {
            256: { region: [] },
            257: { country_name: ['United States'] },
          },
        });
        wrapper.instance().componentDidUpdate(prevProp);
        expect(refreshExceptSpy.callCount).to.equal(0);
      });

      it('remove filter', () => {
        wrapper.setProps({
          refresh: true,
          filters: {
            256: { region: [] },
          },
        });
        wrapper.instance().componentDidUpdate(prevProp);
        expect(refreshExceptSpy.callCount).to.equal(1);
      });

      it('change filter', () => {
        wrapper.setProps({
          refresh: true,
          filters: {
            256: { region: [] },
            257: { country_name: ['Canada'] },
          },
        });
        wrapper.instance().componentDidUpdate(prevProp);
        expect(refreshExceptSpy.callCount).to.equal(1);
      });

      it('add filter', () => {
        wrapper.setProps({
          refresh: true,
          filters: {
            256: { region: [] },
            257: { country_name: ['Canada'] },
            258: { another_filter: ['new'] },
          },
        });
        wrapper.instance().componentDidUpdate(prevProp);
        expect(refreshExceptSpy.callCount).to.equal(1);
      });
    });

    it('should refresh if refresh flag is true', () => {
      wrapper.setProps({
        refresh: true,
        filters: {
          256: { region: ['Asian'] },
        },
      });
      wrapper.instance().componentDidUpdate(prevProp);
      const fetchArgs = fetchSlicesStub.lastCall.args[0];
      expect(fetchArgs).to.have.length(2);
    });

    it('should not refresh filter_immune_slices', () => {
      wrapper.setProps({
        refresh: true,
        filters: {
          256: { region: [] },
          257: { country_name: ['Canada'] },
        },
      });
      wrapper.instance().componentDidUpdate(prevProp);
      const fetchArgs = fetchSlicesStub.lastCall.args[0];
      expect(fetchArgs).to.have.length(1);
    });
  });
});
